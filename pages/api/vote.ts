import Ballot from "artifacts/contracts/Ballot.sol/Ballot.json"
import { Contract, providers, utils } from "ethers"
import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { ballotProposal, nullifierHash, solidityProof } = JSON.parse(req.body)

    const contract = new Contract("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", Ballot.abi)
    const provider = new providers.JsonRpcProvider("http://localhost:8545")

    const contractOwner = contract.connect(provider.getSigner())

    try {
        await contractOwner.vote(utils.formatBytes32String(ballotProposal), nullifierHash, solidityProof)

        res.status(200).end()
    } catch (error: any) {
        const { message } = JSON.parse(error.body).error
        const reason = message.substring(message.indexOf("'") + 1, message.lastIndexOf("'"))

        res.status(500).send(reason || "Unknown error!")
    }
}
