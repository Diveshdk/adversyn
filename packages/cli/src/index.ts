import { Command } from "commander";

const program = new Command("adversyn").description(
  "Adversarial testing for EIP-8141 frame transactions and alt mempools",
);

program
  .command("run")
  .argument("[dir]", "scenario directory", "scenarios/examples")
  .action((dir: string) => {
    console.log(`adversyn: would run scenarios in ${dir} (not implemented yet)`);
  });

program.parse();
