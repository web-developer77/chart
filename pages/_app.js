import '../styles/globals.css'
import 'chartiq/css/normalize.css';
import 'chartiq/css/page-defaults.css';
import 'chartiq/css/stx-chart.css';
import 'chartiq/css/chartiq.css';
import '../styles/CIQ_Seed.css';
import '../styles/buybutton.css';
import '../styles/studymodal.css';
import '../styles/trading.css';
import '../styles/semantic/dist/semantic.min.css';
import 'antd/dist/antd.css';

function SafeHydrate({ children  }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}

function MyApp({ Component, pageProps }) {
  return <SafeHydrate><Component {...pageProps} /></SafeHydrate>
}

export default MyApp
