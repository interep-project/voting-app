import detectEthereumProvider from "@metamask/detect-provider"
import createIdentity from "@interep/identity"
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols"
import { providers } from "ethers"
import Head from "next/head"
import React from "react"
import styles from "../styles/Home.module.css"
import { OffchainAPI } from "@interep/api"

export default function Home() {
    const [logs, setLogs] = React.useState("Connect your wallet and vote!")

    async function vote() {
        setLogs("Creating your Semaphore identity...")

        const provider = (await detectEthereumProvider()) as any

        await provider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(provider)
        const signer = ethersProvider.getSigner()
        const identity = await createIdentity((message: string) => signer.signMessage(message), "Github")

        const identityCommitment = identity.genIdentityCommitment()

        const api = new OffchainAPI("development")
        const { depth } = await api.getGroup({ provider: "github" as any, name: "gold" })
        const identityCommitments = await api.getGroupMembers({ provider: "github" as any, name: "gold" })

        const merkleProof = generateMerkleProof(depth, BigInt(0), identityCommitments, identityCommitment)

        setLogs("Creating your Semaphore proof...")

        const proposal = "1"

        const witness = Semaphore.genWitness(
            identity.getTrapdoor(),
            identity.getNullifier(),
            merkleProof,
            "1",
            proposal
        )

        const { proof, publicSignals } = await Semaphore.genProof(witness, "./semaphore.wasm", "./semaphore_final.zkey")
        const solidityProof = Semaphore.packToSolidityProof(proof)

        const response = await fetch("/api/vote", {
            method: "POST",
            body: JSON.stringify({
                proposal,
                nullifierHash: publicSignals.nullifierHash,
                solidityProof: solidityProof
            })
        })

        if (response.status === 500) {
            const errorMessage = await response.text()

            setLogs(errorMessage)
        } else {
            setLogs("Your anonymous vote is onchain :)")
        }
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Interep Voting</title>
                <meta
                    name="description"
                    content="A simple voting app to allow only users of gold groups to vote anonymously in a poll."
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>Interep Voting</h1>

                <p className={styles.description}>
                    A simple voting app to allow only users of gold groups to vote anonymously in a poll.
                </p>

                <div className={styles.logs}>{logs}</div>

                <div onClick={() => vote()} className={styles.button}>
                    Vote
                </div>
            </main>
        </div>
    )
}
