import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import "hardhat-dependency-compiler"
import { HardhatUserConfig } from "hardhat/config"
import "./tasks/deploy-ballot"

const config: HardhatUserConfig = {
    solidity: "0.8.4",
    dependencyCompiler: {
        paths: ["@interep/contracts/Interep.sol"]
    }
}

export default config
