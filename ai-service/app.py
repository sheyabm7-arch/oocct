import os
import uvicorn
os.environ["TF_USE_LEGACY_KERAS"] = "1"

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import tensorflow as tf
from tensorflow.keras import layers, Model
from tensorflow.keras.applications.mobilenet_v3 import preprocess_input
from PIL import ImageFilter, ImageEnhance
import numpy as np
from PIL import Image
import io
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = tf.keras.models.load_model("Trained_Model.h5", compile=False)
class_names = ['CNV', 'DME', 'DRUSEN', 'NORMAL']


def build_fluid_unet(input_size=(256, 256, 3)):
    inputs = tf.keras.Input(shape=input_size, name='input_14')
    x = layers.Lambda(lambda t: t / 255.0, name='lambda_13')(inputs)
    c1 = layers.Conv2D(16, 3, activation='relu', padding='same', name='conv2d_269')(x)
    c1 = layers.Dropout(0.1, name='dropout_117')(c1)
    c1 = layers.Conv2D(16, 3, activation='relu', padding='same', name='conv2d_270')(c1)
    c1 = layers.Dropout(0.1, name='dropout_118')(c1)
    p1 = layers.MaxPooling2D((2, 2), name='max_pooling2d_52')(c1)
    c2 = layers.Conv2D(32, 3, activation='relu', padding='same', name='conv2d_271')(p1)
    c2 = layers.Dropout(0.1, name='dropout_119')(c2)
    c2 = layers.Conv2D(32, 3, activation='relu', padding='same', name='conv2d_272')(c2)
    c2 = layers.Dropout(0.1, name='dropout_120')(c2)
    p2 = layers.MaxPooling2D((2, 2), name='max_pooling2d_53')(c2)
    c3 = layers.Conv2D(64, 3, activation='relu', padding='same', name='conv2d_273')(p2)
    c3 = layers.Dropout(0.2, name='dropout_121')(c3)
    c3 = layers.Conv2D(64, 3, activation='relu', padding='same', name='conv2d_274')(c3)
    c3 = layers.Dropout(0.2, name='dropout_122')(c3)
    p3 = layers.MaxPooling2D((2, 2), name='max_pooling2d_54')(c3)
    c4 = layers.Conv2D(128, 3, activation='relu', padding='same', name='conv2d_275')(p3)
    c4 = layers.Dropout(0.2, name='dropout_123')(c4)
    c4 = layers.Conv2D(128, 3, activation='relu', padding='same', name='conv2d_276')(c4)
    c4 = layers.Dropout(0.2, name='dropout_124')(c4)
    p4 = layers.MaxPooling2D((2, 2), name='max_pooling2d_55')(c4)
    c5 = layers.Conv2D(256, 3, activation='relu', padding='same', name='conv2d_277')(p4)
    c5 = layers.Dropout(0.3, name='dropout_125')(c5)
    c5 = layers.Conv2D(256, 3, activation='relu', padding='same', name='conv2d_278')(c5)
    u6 = layers.Conv2DTranspose(128, 2, strides=2, padding='same', name='conv2d_transpose_52')(c5)
    u6 = layers.Concatenate(name='concatenate_52')([u6, c4])
    c6 = layers.Conv2D(128, 3, activation='relu', padding='same', name='conv2d_279')(u6)
    c6 = layers.Conv2D(128, 3, activation='relu', padding='same', name='conv2d_280')(c6)
    u7 = layers.Conv2DTranspose(64, 2, strides=2, padding='same', name='conv2d_transpose_53')(c6)
    u7 = layers.Concatenate(name='concatenate_53')([u7, c3])
    c7 = layers.Conv2D(64, 3, activation='relu', padding='same', name='conv2d_281')(u7)
    c7 = layers.Conv2D(64, 3, activation='relu', padding='same', name='conv2d_282')(c7)
    u8 = layers.Conv2DTranspose(32, 2, strides=2, padding='same', name='conv2d_transpose_54')(c7)
    u8 = layers.Concatenate(name='concatenate_54')([u8, c2])
    c8 = layers.Conv2D(32, 3, activation='relu', padding='same', name='conv2d_283')(u8)
    c8 = layers.Conv2D(32, 3, activation='relu', padding='same', name='conv2d_284')(c8)
    u9 = layers.Conv2DTranspose(16, 2, strides=2, padding='same', name='conv2d_transpose_55')(c8)
    u9 = layers.Concatenate(name='concatenate_55')([u9, c1])
    c9 = layers.Conv2D(16, 3, activation='relu', padding='same', name='conv2d_285')(u9)
    c9 = layers.Conv2D(16, 3, activation='relu', padding='same', name='conv2d_286')(c9)
    outputs = layers.Conv2D(1, 1, activation='sigmoid', name='conv2d_287')(c9)
    return Model(inputs, outputs)


fluid_model = build_fluid_unet((256, 256, 3))
fluid_model.load_weights("model_eye_diseases7_denoised.h5", by_name=True)


@app.get("/")
def root():
    return {"message": "OCT AI Service is running"}

@app.post("/classify")
async def classify_image(file: UploadFile = File(...)):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    img = img.resize((224, 224))
    x = np.array(img, dtype=np.float32)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    predictions = model.predict(x)
    result_index = np.argmax(predictions)
    confidence = float(np.max(predictions)) * 100

    return {
        "disease": class_names[result_index],
        "confidence": round(confidence, 2),
        "all_predictions": {
            "CNV": round(float(predictions[0][0]) * 100, 2),
            "DME": round(float(predictions[0][1]) * 100, 2),
            "DRUSEN": round(float(predictions[0][2]) * 100, 2),
            "NORMAL": round(float(predictions[0][3]) * 100, 2),
        },
    }

@app.post("/measure-fluid")
async def measure_fluid(file: UploadFile = File(...)):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    img = img.resize((256, 256))
    x = np.array(img, dtype=np.float32)
    x = np.expand_dims(x, axis=0)
    mask = fluid_model.predict(x, verbose=0)[0, :, :, 0]
    binary_mask = (mask > 0.5).astype(np.uint8)
    fluid_pixels = int(np.sum(binary_mask))
    total_pixels = 256 * 256
    fluid_percentage = round((fluid_pixels / total_pixels) * 100, 2)
    if fluid_percentage < 5:
        recommendation = "No significant fluid detected. Continue routine monitoring."
    elif fluid_percentage < 10:
        recommendation = "Mild fluid detected. Schedule follow-up in 4-6 weeks."
    elif fluid_percentage < 30:
        recommendation = "Moderate fluid detected. Consider anti-VEGF treatment evaluation."
    else:
        recommendation = "Severe fluid detected. Immediate ophthalmologist consultation recommended."
    overlay = np.zeros((256, 256, 3), dtype=np.uint8)
    overlay[binary_mask == 1] = [0, 255, 255]
    mask_img = Image.fromarray(overlay)
    buf = io.BytesIO()
    mask_img.save(buf, format="PNG")
    mask_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return {
        "fluid_percentage": fluid_percentage,
        "fluid_pixels": fluid_pixels,
        "total_pixels": total_pixels,
        "recommendation": recommendation,
        "mask_image": mask_b64,
    }


@app.post("/enhance")
async def enhance_image(file: UploadFile = File(...)):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    w, h = img.size
    img = img.resize((w * 4, h * 4), Image.LANCZOS)
    img = img.filter(ImageFilter.MedianFilter(size=3))
    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
    img = ImageEnhance.Contrast(img).enhance(1.4)
    img = ImageEnhance.Sharpness(img).enhance(2.5)
    img = ImageEnhance.Brightness(img).enhance(1.1)
    img = img.filter(ImageFilter.EDGE_ENHANCE)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
