import { OffchainAPI } from "@interep/api"
import createIdentity from "@interep/identity"
import detectEthereumProvider from "@metamask/detect-provider"
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols"
import Ballot from "artifacts/contracts/Ballot.sol/Ballot.json"
import { Contract, providers, Signer, utils } from "ethers"
import { parseBytes32String } from "ethers/lib/utils"
import Head from "next/head"
import React, { useCallback, useEffect, useState } from "react"
import styles from "../styles/Home.module.css"

export default function Home() {
    const [logs, setLogs] = useState<string>("Connect your wallet and vote!")
    const [signer, setSigner] = useState<Signer>()
    const [ballotName, setBallotName] = useState<string>()
    const [ballotProposals, setProposals] = useState<string[]>()

    useEffect(() => {
        ;(async () => {
            const ethereumProvider = (await detectEthereumProvider()) as any

            // TODO: Update network automatically.
            await ethereumProvider.request({ method: "eth_requestAccounts" })

            const ethersProvider = new providers.Web3Provider(ethereumProvider)
            const signer = ethersProvider.getSigner()

            const contract = new Contract("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", Ballot.abi, signer)

            const filter = contract.filters["BallotCreated"]()
            const events = await contract.queryFilter(filter)

            const [name, proposals] = events[0].args as any

            setSigner(signer)
            setBallotName(name)
            setProposals(proposals)
        })()
    }, [])

    const vote = useCallback(async () => {
        if (signer && ballotName && ballotProposals) {
            setLogs("Creating your Semaphore identity...")

            const identity = await createIdentity((message: string) => signer.signMessage(message), "Github")

            const identityCommitment = identity.genIdentityCommitment()

            const api = new OffchainAPI("development")
            const { depth } = await api.getGroup({ provider: "github" as any, name: "gold" })
            const identityCommitments = await api.getGroupMembers({ provider: "github" as any, name: "gold" })

            const merkleProof = generateMerkleProof(depth, BigInt(0), identityCommitments, identityCommitment)

            setLogs("Creating your Semaphore proof...")

            const proposal = ballotProposals[0]

            const witness = Semaphore.genWitness(
                identity.getTrapdoor(),
                identity.getNullifier(),
                merkleProof,
                BigInt(ballotName),
                proposal
            )

            const { proof, publicSignals } = await Semaphore.genProof(
                witness,
                "./semaphore.wasm",
                "./semaphore_final.zkey"
            )
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
    }, [signer, ballotName, ballotProposals])

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

                {
                    // Add cool UX with select component.
                    ballotName && ballotProposals && (
                        <>
                            <h2 className={styles.title}>{parseBytes32String(ballotName)}</h2>

                            <h2 className={styles.title}>{ballotProposals.map(parseBytes32String).join(", ")}</h2>
                        </>
                    )
                }

                <p className={styles.description}>
                    A simple voting app to allow only users of gold groups to vote anonymously in a poll.
                </p>

                <div className={styles.logs}>{logs}</div>

                <div onClick={vote} className={styles.button}>
                    Vote
                </div>
            </main>
        </div>
    )
}
