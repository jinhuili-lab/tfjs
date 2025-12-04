// pages/_app.js
import '../styles.css' // optional, only if you add a styles.css
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
