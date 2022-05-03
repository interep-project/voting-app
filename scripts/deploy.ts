import { run } from "hardhat"
import inquirer from "inquirer"

async function main() {
    const { interepAddress, name } = await inquirer.prompt([
        {
            type: "input",
            name: "interepAddress",
            message: "Interep contract address:",
            default() {
                return "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
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
