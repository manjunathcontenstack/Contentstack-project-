import React, { useMemo, useEffect, useState } from 'react'

function extractBody(htmlString){
	if (!htmlString) return ''
	const match = htmlString.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
	return match ? match[1] : htmlString
}

function rewriteLinksAndAssets(html){
	if (!html) return html
	let out = html
	// Ensure assets paths are absolute so they work on nested routes
	out = out.replace(/(src|href)=("|')assets\//g, '$1=$2/assets/')
	// index.html -> /
	out = out.replace(/href=("|')\/?index\.html(#[^"']*)?("|')/gi, 'href=$1/$2$3')
	// *.html -> /path (skip /assets/ and external links)
	out = out.replace(/href=("|')([^"']+?\.html)(#[^"']*)?("|')/gi, (m, q1, path, hash = '', q2) => {
		if (path.startsWith('http') || path.startsWith('mailto:') || path.startsWith('tel:')) return m
		if (path.startsWith('/assets/') || path.startsWith('assets/')) return m
		const clean = path.replace(/^\//, '')
		const pretty = '/' + clean.slice(0, -5)
		return `href=${q1}${pretty}${hash || ''}${q2}`
	})
	return out
}

function ensureGlobalScriptsLoaded(){
	const wanted = ['/assets/script.js', '/assets/contentstack-sync.js']
	wanted.forEach(src => {
		if (!document.querySelector(`script[src='${src}']`)){
			const s = document.createElement('script')
			s.src = src
			s.async = true
			document.body.appendChild(s)
		}
	})
}

export default function StaticHtmlPage({ path }){
	const [rawHtml, setRawHtml] = useState('')
	const inner = useMemo(() => rewriteLinksAndAssets(extractBody(rawHtml)), [rawHtml])

	useEffect(() => {
		let aborted = false
		async function load(){
			try{
				const res = await fetch(path, { cache: 'no-store' })
				const text = await res.text()
				if (!aborted) setRawHtml(text)
			} catch(e){
				// ignore
			}
		}
		load()
		return () => { aborted = true }
	}, [path])

	useEffect(() => {
		// Allow global script.js to scan the DOM after content mounts
		ensureGlobalScriptsLoaded()
		if (window && typeof window.dispatchEvent === 'function') {
			window.dispatchEvent(new Event('DOMContentLoaded'))
		}
	}, [inner])
	return <div dangerouslySetInnerHTML={{ __html: inner }} />
}
