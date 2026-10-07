'use client';

import { useEffect, useState } from 'react';
import { IDENTITY_EVENT, isIdentityHidden, maskIdentity, setIdentityHidden } from '@/lib/identityMask';

const ATTRS = ['title', 'placeholder', 'alt', 'aria-label'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA']);

type Entry = { orig: string; masked: string };

/**
 * Applies "hide identity" mode to the whole page: rewrites rendered text (incl. chart labels, options and
 * tooltips) through maskIdentity and blurs MRA / brand images (globals.css, html.hide-identity).
 * React keeps owning the nodes: when it updates a masked node we re-mask the new value; turning the mode off
 * restores every node we changed that React has not replaced since. Data and form values are never touched.
 *
 * Toggle: admin header button, Ctrl+Shift+H anywhere, or ?hideIdentity=1 / 0 in the URL.
 */
export default function IdentityMask() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('hideIdentity');
    if (q === '1' || q === '0') setIdentityHidden(q === '1');
    setOn(isIdentityHidden());
    const onEvent = (e: Event) => setOn(!!(e as CustomEvent).detail);
    const onStorage = (e: StorageEvent) => e.key === 'hr_hub_hide_identity' && setOn(e.newValue === '1');
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIdentityHidden(!isIdentityHidden());
      }
    };
    window.addEventListener(IDENTITY_EVENT, onEvent);
    window.addEventListener('storage', onStorage);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(IDENTITY_EVENT, onEvent);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (!on) {
      root.classList.remove('hide-identity');
      return;
    }
    root.classList.add('hide-identity');

    const texts = new Map<Text, Entry>();
    const attrs = new Map<Element, Record<string, Entry>>();
    const realTitle = document.title;

    const maskText = (node: Text) => {
      const parent = node.parentElement;
      if (!parent || SKIP.has(parent.tagName) || parent.closest('[data-identity-keep]')) return;
      const value = node.nodeValue || '';
      const known = texts.get(node);
      if (known && value === known.masked) return; // our own write
      const masked = maskIdentity(value);
      if (masked === value) {
        texts.delete(node);
        return;
      }
      texts.set(node, { orig: value, masked });
      node.nodeValue = masked;
    };

    const maskAttrs = (el: Element) => {
      if (el.closest('[data-identity-keep]')) return;
      ATTRS.forEach((name) => {
        const value = el.getAttribute(name);
        if (value === null) return;
        const rec = attrs.get(el) || {};
        if (rec[name] && rec[name].masked === value) return;
        const masked = maskIdentity(value);
        if (masked === value) return;
        rec[name] = { orig: value, masked };
        attrs.set(el, rec);
        el.setAttribute(name, masked);
      });
    };

    const maskTree = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) return maskText(node as Text);
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as Element;
      if (SKIP.has(el.tagName)) return;
      maskAttrs(el);
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let n = walker.nextNode();
      while (n) {
        if (n.nodeType === Node.TEXT_NODE) maskText(n as Text);
        else maskAttrs(n as Element);
        n = walker.nextNode();
      }
    };

    maskTree(document.body);
    document.title = maskIdentity(realTitle);

    const observer = new MutationObserver((records) => {
      records.forEach((r) => {
        if (r.type === 'characterData') maskText(r.target as Text);
        else if (r.type === 'attributes') maskAttrs(r.target as Element);
        else r.addedNodes.forEach(maskTree);
      });
      const t = maskIdentity(document.title);
      if (t !== document.title) document.title = t;
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });

    return () => {
      observer.disconnect();
      // Restore only what still shows our masked value (React may have re-rendered the rest already)
      texts.forEach((e, node) => {
        if (node.isConnected && node.nodeValue === e.masked) node.nodeValue = e.orig;
      });
      attrs.forEach((rec, el) => {
        Object.entries(rec).forEach(([name, e]) => {
          if (el.isConnected && el.getAttribute(name) === e.masked) el.setAttribute(name, e.orig);
        });
      });
      document.title = realTitle;
      root.classList.remove('hide-identity');
    };
  }, [on]);

  return null;
}
