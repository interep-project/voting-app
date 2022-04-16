import {
    Button,
    CheckboxGroup,
    Checkbox,
    Container,
    Divider,
    Heading,
    HStack,
    Image,
    Spinner,
    Text,
    Tooltip,
    useClipboard,
    VStack
} from "@chakra-ui/react"
import { OffchainAPI } from "@interep/api"
import createIdentity from "@interep/identity"
import detectEthereumProvider from "@metamask/detect-provider"
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols"
import Ballot from "artifacts/contracts/Ballot.sol/Ballot.json"
import { Contract, providers, Signer, utils } from "ethers"
import { getAddress, parseBytes32String } from "ethers/lib/utils"
import Head from "next/head"
import React, { useCallback, useEffect, useState } from "react"

export default function Home() {
    const [logs, setLogs] = useState<[string, string]>()
    const [account, setAccount] = useState<string>()
    const { hasCopied, onCopy } = useClipboard(account || "")
    const [signer, setSigner] = useState<Signer>()
    const [ballotName, setBallotName] = useState<string>()
    const [ballotProposals, setProposals] = useState<string[]>()

    useEffect(() => {
        ;(async () => {
            const ethereumProvider = (await detectEthereumProvider()) as any
            const accounts = await ethereumProvider.request({ method: "eth_accounts" })
            const ethersProvider = new providers.Web3Provider(ethereumProvider)

            if (accounts[0]) {
                setAccount(getAddress(accounts[0]))
                setSigner(ethersProvider.getSigner())
            }

            ethereumProvider.on("accountsChanged", (newAccounts: string[]) => {
                if (newAccounts.length !== 0) {
                    setAccount(getAddress(newAccounts[0]))
                    setSigner(ethersProvider.getSigner())
                } else {
                    setAccount(undefined)
                    setSigner(undefined)
                }
            })
        })()
    }, [])

    useEffect(() => {
        ;(async () => {
            if (signer) {
                const contract = new Contract("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", Ballot.abi, signer)

                const filter = contract.filters["BallotCreated"]()
                const events = await contract.queryFilter(filter)

                const [name, proposals] = events[0].args as any

                setBallotName(name)
                setProposals(proposals.map(parseBytes32String))
            }
        })()
    }, [signer])

    const connect = useCallback(async () => {
        const ethereumProvider = (await detectEthereumProvider()) as any

        // TODO: Update network automatically.
        await ethereumProvider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(ethereumProvider)
        const signer = ethersProvider.getSigner()

        setSigner(signer)
        setAccount(await signer.getAddress())
    }, [])

    const vote = useCallback(async () => {
        if (signer && ballotName && ballotProposals) {
            setLogs(["background", "Creating your Semaphore identity..."])

            try {
                const identity = await createIdentity((message: string) => signer.signMessage(message), "Github")

                const identityCommitment = identity.genIdentityCommitment()

                const api = new OffchainAPI("development")
                const { depth } = await api.getGroup({ provider: "github" as any, name: "gold" })
                const identityCommitments = await api.getGroupMembers({ provider: "github" as any, name: "gold" })

                const merkleProof = generateMerkleProof(depth, BigInt(0), identityCommitments, identityCommitment)

                setLogs(["background", "Creating your Semaphore proof..."])

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

                    setLogs(["red", errorMessage])
                } else {
                    setLogs(["green", "Your anonymous vote is onchain :)"])
                }
            } catch (error: any) {
                setLogs(["red", error.message])
            }
        }
    }, [signer, ballotName, ballotProposals])

    function shortenAddress(address: string, chars = 4): string {
        address = utils.getAddress(address)

        return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`
    }

    return (
        <>
            <Head>
                <title>Voting App</title>
                <meta
                    name="description"
                    content="A simple voting app to allow only users of gold groups to vote anonymously in a poll."
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Container maxW="container.lg">
                <HStack justify="space-between" mt="10">
                    <Image src="./interep-logo.svg" alt="Interep logo" h={10} />

                    {!account ? (
                        <Button colorScheme="primary" onClick={connect}>
                            Connect Wallet
                        </Button>
                    ) : (
                        <Tooltip label={hasCopied ? "Copied!" : "Copy"} closeOnClick={false} hasArrow>
                            <Button onClick={onCopy} onMouseDown={(e) => e.preventDefault()}>
                                {shortenAddress(account)}
                            </Button>
                        </Tooltip>
                    )}
                </HStack>
            </Container>

            <Container maxW="container.md">
                <VStack mt="150px" mb="12">
                    <Heading as="h2" size="xl" mb="2">
                        Voting App
                    </Heading>

                    <Text color="background.400" fontSize="md">
                        A simple voting app to allow only users of gold groups to vote anonymously in a poll.
                    </Text>
                </VStack>

                <Divider />

                {!account ? (
                    <Text textAlign="center" color="background.400" fontSize="lg" pt="100px">
                        You need to connect your wallet!
                    </Text>
                ) : !ballotName || !ballotProposals ? (
                    <VStack h="200px" align="center" justify="center">
                        <Spinner thickness="4px" speed="0.65s" size="xl" />
                    </VStack>
                ) : (
                    <VStack spacing="6" align="left" mt="12" px="40">
                        <Heading as="h3" size="lg">
                            {parseBytes32String(ballotName)}
                        </Heading>

                        <CheckboxGroup>
                            {ballotProposals.map((p, i) => (
                                <Checkbox key={i} value={p}>
                                    {p}
                                </Checkbox>
                            ))}
                        </CheckboxGroup>

                        <Button colorScheme="primary" onClick={vote}>
                            Vote
                        </Button>
                    </VStack>
                )}
            </Container>

            {logs && (
                <Text mt="20" color={`${logs[0]}.400`} fontSize="lg">
                    {logs[1]}
                </Text>
            )}
        </>
    )
}
