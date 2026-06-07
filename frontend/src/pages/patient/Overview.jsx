import { useState } from 'react'
import { Eye, Layers, Droplets, Activity } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

const conditions = [
  {
    id: 'drusen',
    label: { en: 'Drusen', ar: 'دروسن' },
    color: 'text-yellow-500',
    icon: <Layers size={32} className="text-yellow-500" />,
    description: {
      en: 'Yellow deposits beneath the retina associated with Age-Related Macular Degeneration (AMD)',
      ar: 'ترسبات صفراء تحت الشبكية مرتبطة بالتنكس البقعي المرتبط بالعمر (AMD)',
    },
    what: {
      en: 'Drusen are small yellow or white deposits that form beneath the retina. They are composed of extracellular material that accumulates between Bruch\'s membrane and the retinal pigment epithelium (RPE). Drusen are one of the earliest signs of age-related macular degeneration (AMD).',
      ar: 'الدروسن هي ترسبات صغيرة صفراء أو بيضاء تتشكل تحت الشبكية. تتكون من مواد خارج الخلية تتراكم بين غشاء بروخ وظهارة الصبغة الشبكية (RPE). تُعد الدروسن من أولى علامات التنكس البقعي المرتبط بالعمر (AMD).',
    },
    types: [
      { name: { en: 'Hard Drusen', ar: 'دروسن صلبة' }, desc: { en: 'Small, well-defined deposits that usually don\'t cause vision problems', ar: 'ترسبات صغيرة واضحة الحدود لا تسبب عادةً مشاكل في الرؤية' } },
      { name: { en: 'Soft Drusen', ar: 'دروسن لينة' }, desc: { en: 'Larger, less defined deposits that indicate higher risk of AMD progression', ar: 'ترسبات أكبر وأقل وضوحاً تشير إلى خطر أعلى لتطور AMD' } },
      { name: { en: 'Calcified Drusen', ar: 'دروسن متكلسة' }, desc: { en: 'Hardened deposits that appear bright on OCT imaging', ar: 'ترسبات متصلبة تظهر ساطعة في تصوير OCT' } },
    ],
  },
  {
    id: 'dme',
    label: { en: 'DME', ar: 'الوذمة البقعية السكرية' },
    color: 'text-blue-500',
    icon: <Droplets size={32} className="text-blue-500" />,
    description: {
      en: 'Diabetic Macular Edema — fluid accumulation in the macula due to diabetic retinopathy',
      ar: 'الوذمة البقعية السكرية — تراكم السوائل في البقعة بسبب اعتلال الشبكية السكري',
    },
    what: {
      en: 'DME occurs when blood vessels in the retina leak fluid into the macula, causing it to swell. It is a complication of diabetic retinopathy and is one of the leading causes of vision loss in people with diabetes.',
      ar: 'تحدث الوذمة البقعية السكرية عندما تتسرب الأوعية الدموية في الشبكية سوائل إلى البقعة، مما يسبب تورمها. وهي من مضاعفات اعتلال الشبكية السكري ومن الأسباب الرئيسية لفقدان البصر لدى مرضى السكري.',
    },
    types: [
      { name: { en: 'Focal DME', ar: 'وذمة بؤرية' }, desc: { en: 'Localized leakage from specific microaneurysms', ar: 'تسرب موضعي من تمددات وعائية دقيقة محددة' } },
      { name: { en: 'Diffuse DME', ar: 'وذمة منتشرة' }, desc: { en: 'Widespread leakage from dilated capillaries across the macula', ar: 'تسرب واسع من الشعيرات الدموية المتوسعة عبر البقعة' } },
    ],
  },
  {
    id: 'cnv',
    label: { en: 'CNV', ar: 'الأوعية الدموية المشيمية الجديدة' },
    color: 'text-red-500',
    icon: <Activity size={32} className="text-red-500" />,
    description: {
      en: 'Choroidal Neovascularization — abnormal blood vessel growth beneath the retina',
      ar: 'تكوّن أوعية دموية مشيمية جديدة — نمو غير طبيعي للأوعية الدموية تحت الشبكية',
    },
    what: {
      en: 'CNV is the growth of new blood vessels that originate from the choroid through Bruch\'s membrane into the sub-retinal pigment epithelium or subretinal space. These vessels are fragile and can leak fluid or blood, causing rapid vision loss.',
      ar: 'هو نمو أوعية دموية جديدة تنشأ من المشيمية عبر غشاء بروخ إلى الحيز تحت ظهارة الصبغة الشبكية أو تحت الشبكية. هذه الأوعية هشة وقد تتسرب منها سوائل أو دم مسببة فقداناً سريعاً للبصر.',
    },
    types: [
      { name: { en: 'Type 1 CNV', ar: 'النوع الأول' }, desc: { en: 'Below the RPE layer (occult)', ar: 'تحت طبقة RPE (خفي)' } },
      { name: { en: 'Type 2 CNV', ar: 'النوع الثاني' }, desc: { en: 'Above the RPE layer (classic)', ar: 'فوق طبقة RPE (كلاسيكي)' } },
      { name: { en: 'Type 3 CNV', ar: 'النوع الثالث' }, desc: { en: 'Originates from retinal vasculature', ar: 'ينشأ من الأوعية الدموية الشبكية' } },
    ],
  },
  {
    id: 'normal',
    label: { en: 'Normal', ar: 'طبيعي' },
    color: 'text-green-600',
    icon: <Eye size={32} className="text-green-600" />,
    description: {
      en: 'Healthy retinal structure with no signs of disease',
      ar: 'بنية شبكية سليمة دون أي علامات للمرض',
    },
    what: {
      en: 'A normal OCT scan shows clear, well-defined retinal layers with uniform thickness. The foveal depression is visible, and there are no signs of fluid, deposits, or abnormal blood vessels.',
      ar: 'تُظهر صورة OCT الطبيعية طبقات شبكية واضحة ومحددة بسماكة منتظمة. ويظهر الانخفاض النقري، ولا توجد أي علامات لسوائل أو ترسبات أو أوعية دموية غير طبيعية.',
    },
    types: [
      { name: { en: 'Healthy Retina', ar: 'شبكية سليمة' }, desc: { en: 'All retinal layers clearly visible and properly structured', ar: 'جميع طبقات الشبكية مرئية بوضوح ومنظمة بشكل سليم' } },
      { name: { en: 'Normal Fovea', ar: 'نقرة طبيعية' }, desc: { en: 'Central depression present with normal thickness profile', ar: 'الانخفاض المركزي موجود بسماكة طبيعية' } },
    ],
  },
]

export default function Overview() {
  const [activeTab, setActiveTab] = useState('drusen')
  const active = conditions.find((c) => c.id === activeTab)
  const { t, lang } = useLang()
  const L = (obj) => obj[lang] ?? obj.en

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('overviewTitle')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('overviewSub')}</p>
      </div>

      {/* OCT Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="text-blue-600" size={20} />
          <h3 className="text-blue-600 font-semibold">{t('octFull')}</h3>
        </div>
        <p className="text-blue-700 text-sm leading-relaxed mb-3">{t('octIntro')}</p>
        <p className="text-blue-700 text-sm font-medium mb-4">{t('octClassifies')}</p>

        {/* Condition Cards */}
        <div className="grid grid-cols-4 gap-3">
          {conditions.map((c) => (
            <div key={c.id} className="border border-gray-100 rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-sm transition">
              {c.icon}
              <span className={`text-sm font-semibold ${c.color}`}>{L(c.label)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Condition Detail Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {conditions.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveTab(c.id)}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === c.id
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {L(c.label)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            {active.icon}
            <h3 className="text-lg font-bold text-gray-900">{L(active.label)}</h3>
          </div>
          <p className="text-gray-500 text-sm mb-5">{L(active.description)}</p>

          <h4 className="font-bold text-gray-900 mb-2">{t('whatIs')} {L(active.label)}؟</h4>
          <p className="text-blue-600 text-sm leading-relaxed mb-5">{L(active.what)}</p>

          <h4 className="font-bold text-gray-900 mb-3">{t('typesOf')} {L(active.label)}</h4>
          <ul className="space-y-2">
            {active.types.map((ty) => (
              <li key={L(ty.name)} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span><span className="font-semibold">{L(ty.name)}:</span> {L(ty.desc)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
