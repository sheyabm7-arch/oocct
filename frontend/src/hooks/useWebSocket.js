import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getToken } from '../api'

/**
 * Connects to the Spring STOMP broker and subscribes to the user's
 * personal topic channel: /topic/messages.{userId}
 *
 * Uses a ref for the callback so the subscription is never recreated
 * when parent state changes — avoids stale-closure bugs.
 *
 * @param {number|null} userId  - current user id (or null = skip)
 * @param {function}    onMessage - called with each incoming Message object
 * @returns {{ sendWsMessage }}
 */
export function useWebSocket(userId, onMessage) {
  const clientRef    = useRef(null)
  const callbackRef  = useRef(onMessage)

  // Always keep the ref pointing at the latest callback version
  useEffect(() => { callbackRef.current = onMessage })

  useEffect(() => {
    if (!userId) return

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:9000/ws'),
      connectHeaders: { Authorization: `Bearer ${getToken() ?? ''}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/messages.${userId}`, (frame) => {
          callbackRef.current(JSON.parse(frame.body))
        })
      },
    })

    client.activate()
    clientRef.current = client

    return () => { client.deactivate() }
  }, [userId]) // only re-runs if the logged-in user changes

  /** Publish a message via WebSocket — no HTTP round-trip needed */
  const sendWsMessage = useCallback((senderId, receiverId, content) => {
    clientRef.current?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ senderId, receiverId, content }),
    })
  }, [])

  return { sendWsMessage }
}
