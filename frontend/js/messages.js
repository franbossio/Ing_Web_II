// js/messages.js
// Lógica compartida de la página de mensajería para candidato y empresa.
import { authFetch, getUser } from './auth.js';

const POLL_MS = 5000;

export function initMessages() {
  const me = getUser();
  if (!me) return;

  const listEl       = document.getElementById('msg-conv-list');
  const emptyState    = document.getElementById('msg-empty-state');
  const chatPanel      = document.getElementById('msg-chat-panel');
  const headerName    = document.getElementById('msg-chat-header-name');
  const headerSub     = document.getElementById('msg-chat-header-sub');
  const threadEl      = document.getElementById('msg-thread');
  const inputEl       = document.getElementById('msg-input');
  const sendBtn       = document.getElementById('msg-send-btn');

  let conversations  = [];
  let activeConvId    = null;
  let pollTimer       = null;

  function initials(name) {
    return name && name !== '—'
      ? name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
      : '?';
  }

  function otherName(otherUser) {
    if (!otherUser) return 'Usuario';
    return [otherUser.firstName, otherUser.lastName].filter(Boolean).join(' ')
      || otherUser.companyName || otherUser.email || 'Usuario';
  }

  function avatarHtml(otherUser, className, id) {
    const name = otherName(otherUser);
    const idAttr = id ? ` id="${id}"` : '';
    if (otherUser && otherUser.photo) {
      return `<div class="${className}"${idAttr} style="background-image:url('${otherUser.photo}');background-size:cover;background-position:center;"></div>`;
    }
    return `<div class="${className}"${idAttr}>${initials(name)}</div>`;
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  }

  function renderConvList() {
    if (!conversations.length) {
      listEl.innerHTML = `<div style="padding:24px 16px;text-align:center;color:var(--clr-muted);font-size:0.82rem;">
        Todavía no tenés conversaciones.
      </div>`;
      return;
    }

    listEl.innerHTML = conversations.map(c => {
      const name = otherName(c.otherUser);
      const active = c.id === activeConvId ? 'active' : '';
      return `
        <div class="msg-conv-item ${active}" data-id="${c.id}">
          ${avatarHtml(c.otherUser, 'msg-conv-avatar')}
          <div class="msg-conv-body">
            <div class="msg-conv-name">${name}</div>
            <div class="msg-conv-preview">${c.lastMessagePreview || (c.job ? '📋 ' + c.job.title : 'Sin mensajes aún')}</div>
          </div>
          <div class="msg-conv-meta">
            <span class="msg-conv-time">${formatTime(c.lastMessageAt)}</span>
            ${c.unreadCount > 0 ? `<span class="msg-unread-badge">${c.unreadCount}</span>` : ''}
          </div>
        </div>`;
    }).join('');

    listEl.querySelectorAll('.msg-conv-item').forEach(el => {
      el.addEventListener('click', () => openConversation(el.dataset.id));
    });
  }

  async function loadConversations() {
    try {
      const res = await authFetch('/messages/conversations');
      if (!res.ok) return;
      conversations = await res.json();
      renderConvList();
    } catch (e) {
      console.error('Error cargando conversaciones', e);
    }
  }

  function renderMessages(messages) {
    const myId = (getUser() || me).id;
    threadEl.innerHTML = messages.map(m => {
      const mine = m.senderId === myId;
      return `
        <div class="msg-bubble-row ${mine ? 'mine' : ''}">
          <div class="msg-bubble">
            ${escapeHtml(m.content)}
            <div class="msg-bubble-time">${formatTime(m.createdAt)}</div>
          </div>
        </div>`;
    }).join('');
    threadEl.scrollTop = threadEl.scrollHeight;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function openConversation(id) {
    activeConvId = id;
    renderConvList();
    emptyState.style.display = 'none';
    chatPanel.style.display  = 'flex';

    const conv = conversations.find(c => c.id === id);
    if (conv) {
      headerName.textContent = otherName(conv.otherUser);
      headerSub.textContent  = conv.job ? `Sobre: ${conv.job.title}` : '';
      const headerAvatarEl = document.getElementById('msg-chat-header-avatar');
      if (headerAvatarEl) headerAvatarEl.outerHTML = avatarHtml(conv.otherUser, 'msg-conv-avatar', 'msg-chat-header-avatar');
    }

    try {
      const res = await authFetch(`/messages/conversations/${id}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      renderMessages(data.messages || []);
      // El conteo de no leídos ya se actualizó en el backend al abrir
      const c = conversations.find(x => x.id === id);
      if (c) c.unreadCount = 0;
      renderConvList();
    } catch (e) {
      console.error('Error cargando mensajes', e);
    }
  }

  async function sendMessage() {
    const content = inputEl.value.trim();
    if (!content || !activeConvId) return;

    sendBtn.disabled = true;
    try {
      const res = await authFetch(`/messages/conversations/${activeConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('No se pudo enviar el mensaje');
      inputEl.value = '';
      const res2 = await authFetch(`/messages/conversations/${activeConvId}/messages`);
      if (res2.ok) {
        const data = await res2.json();
        renderMessages(data.messages || []);
      }
      loadConversations();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Polling: refresca lista de conversaciones y, si hay una abierta, sus mensajes
  pollTimer = setInterval(async () => {
    await loadConversations();
    if (activeConvId) {
      try {
        const res = await authFetch(`/messages/conversations/${activeConvId}/messages`);
        if (res.ok) {
          const data = await res.json();
          renderMessages(data.messages || []);
        }
      } catch {}
    }
  }, POLL_MS);

  window.addEventListener('beforeunload', () => clearInterval(pollTimer));

  // Si llegamos con ?userId=...&jobId=... iniciamos/abrimos esa conversación
  async function openFromQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const otherUserId = params.get('userId');
    if (!otherUserId) return;
    const jobId = params.get('jobId') || undefined;

    try {
      const res = await authFetch('/messages/conversations', {
        method: 'POST',
        body: JSON.stringify({ otherUserId, jobId }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Error'); }
      const conv = await res.json();
      await loadConversations();
      openConversation(conv.id);
    } catch (e) {
      console.error('No se pudo iniciar la conversación', e);
      alert('No se pudo iniciar la conversación: ' + e.message);
    }
  }

  loadConversations().then(openFromQueryParams);
}
