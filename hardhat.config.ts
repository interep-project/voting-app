import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import "hardhat-dependency-compiler"
import { HardhatUserConfig } from "hardhat/config"
import "./tasks/deploy"

const config: HardhatUserConfig = {
    solidity: "0.8.4",
    dependencyCompiler: {
        paths: ["@appliedzkp/semaphore-contracts/base/Verifier.sol"]
    }
}

export default config
