export default function Footer(){
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="container footnote">
        <p>© {year} Contentstack.</p>
      </div>
    </footer>
  )
}


