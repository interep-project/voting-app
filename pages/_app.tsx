import { ChakraProvider } from "@chakra-ui/react"
import "@fontsource/inter/400.css"
import type { AppProps } from "next/app"
import theme from "../styles"

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ChakraProvider theme={theme}>
            <Component {...pageProps} />
        </ChakraProvider>
    )
}

export default MyApp
