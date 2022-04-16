import { SystemStyleObject } from "@chakra-ui/react"
// import { Styles } from "@chakra-ui/theme-tools"

const styles: any = {
    global: (): SystemStyleObject => ({
        body: {
            bg: "background.900",
            color: "whiteAlpha.900"
        },
        "body, #__next": {
            minHeight: "100vh"
        },
        "#__next": {
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
        }
    })
}

export default styles
