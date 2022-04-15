import { Contract } from "ethers"
import { formatBytes32String } from "ethers/lib/utils"
import { task, types } from "hardhat/config"

task("deploy", "Deploy a Ballot contract")
    .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
    .addParam("interepAddress", "Interep contract address", undefined, types.string)
    .addParam("name", "Name of the ballot", undefined, types.string)
    .addParam("proposals", "Proposals of the ballot", undefined, types.json)
    .setAction(async ({ logs, interepAddress, name, proposals }, { ethers }): Promise<Contract> => {
        const ContractFactory = await ethers.getContractFactory("Ballot")

        const contract = await ContractFactory.deploy(
            interepAddress,
            formatBytes32String(name),
            proposals.map(formatBytes32String)
        )

        await contract.deployed()

        logs && console.log(`Ballot contract has been deployed to: ${contract.address}`)

        return contract
    })
