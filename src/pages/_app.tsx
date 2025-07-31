import type { AppType } from "next/app"
import { Geist } from "next/font/google"
import { ThemeProvider } from "~/components/providers/ThemeProvider"
import { api } from "~/utils/api"

import "~/styles/globals.css"

const geist = Geist({
  subsets: ["latin"],
})

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <div className={geist.className}>
        <Component {...pageProps} />
      </div>
    </ThemeProvider>
  )
}

export default api.withTRPC(MyApp)
