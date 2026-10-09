import React, { useEffect, useMemo, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';
import { isValidUrl } from 'utils/url/index';

// Renderer markdown khusus bubble chat: kompak untuk panel sempit,
// breaks:false supaya spacing mengikuti markdown standar (output CLI sudah
// pakai baris kosong antar paragraf), html:false karena konten dari CLI.
const md = new MarkdownIt({
  html: false,
  breaks: false,
  linkify: true
});

const copyCode = (pre, btn) => {
  // Teks ada di <code> (anak pertama), bukan innerText <pre> — supaya
  // label tombol "Copy" ikut ter-copy.
  const code = pre.querySelector('code');
  const text = (code ? code.innerText : pre.innerText).replace(/\n$/, '');
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('copied');
      }, 1200);
    })
    .catch(() => toast.error('Failed to copy'));
};

const ChatMarkdown = ({ content }) => {
  const containerRef = useRef(null);

  const cleanHTML = useMemo(() => {
    const rendered = md.render(content || '');
    return DOMPurify.sanitize(rendered);
  }, [content]);

  // Tambahkan tombol Copy ke setiap code block (idempotent — streaming delta
  // me-render ulang HTML, jadi jangan dobel tombolnya).
  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      return;
    }
    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector(':scope > .ai-md-copy-btn')) {
        return;
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ai-md-copy-btn';
      btn.title = 'Copy code';
      btn.textContent = 'Copy';
      pre.appendChild(btn);
    });
  }, [cleanHTML]);

  const handleOnClick = (event) => {
    const copyBtn = event.target.closest?.('.ai-md-copy-btn');
    if (copyBtn) {
      event.preventDefault();
      const pre = copyBtn.closest('pre');
      if (pre) {
        copyCode(pre, copyBtn);
      }
      return;
    }

    const target = event.target;
    if (target.tagName === 'A') {
      event.preventDefault();
      const href = target.getAttribute('href');
      if (href && isValidUrl(href)) {
        window.open(href, '_blank');
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="ai-md"
      dangerouslySetInnerHTML={{ __html: cleanHTML }}
      onClick={handleOnClick}
    />
  );
};

export default ChatMarkdown;
