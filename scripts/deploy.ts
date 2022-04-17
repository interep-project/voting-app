import { run } from "hardhat"
import inquirer from "inquirer"

async function main() {
    const { interepAddress, name } = await inquirer.prompt([
        {
            type: "input",
            name: "interepAddress",
            message: "Interep contract address:",
            default() {
                return "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
            }
        },
        {
            type: "input",
            name: "name",
            message: "Ballot name:",
            default() {
                return "Ballot"
            }
        }
    ])

    const proposals: string[] = []

    async function addProposal() {
        const response = await inquirer.prompt([
            {
                type: "input",
                name: "proposal",
                message: "Ballot proposal:"
            },
            {
                type: "confirm",
                name: "askAgain",
                message: "Do you want to add another ballot proposal?",
                default: true
            }
        ])

        proposals.push(response.proposal)

        if (response.askAgain) {
            await addProposal()
        }
    }

    await addProposal()

    const { address: ballotAddress } = await run("deploy:ballot", {
        logs: false,
        interepAddress,
        name,
        proposals
    })

    console.log(`\nBallot contract has been deployed to: ${ballotAddress}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
