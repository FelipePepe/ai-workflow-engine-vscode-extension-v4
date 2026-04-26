import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type PackageCommand = {
  command: string;
  title: string;
};

type PackageJson = {
  contributes?: {
    commands?: PackageCommand[];
  };
};

function loadPackageJson(): PackageJson {
  const packagePath = join(process.cwd(), "package.json");
  const raw = readFileSync(packagePath, "utf-8");
  return JSON.parse(raw) as PackageJson;
}

function verifyCommands(pkg: PackageJson): void {
  const commands = pkg.contributes?.commands ?? [];

  assert.ok(commands.length > 0, "No hay comandos declarados en contributes.commands");

  const requiredCommands = [
    "aiWorkflow.openDashboard",
    "aiWorkflow.createPlan",
    "aiWorkflow.runTask"
  ];

  for (const required of requiredCommands) {
    const found = commands.some((command) => command.command === required);
    assert.ok(found, `Falta comando requerido: ${required}`);
  }
}

function main(): void {
  const pkg = loadPackageJson();
  verifyCommands(pkg);
  console.log("Smoke test OK: comandos principales declarados en package.json");
}

main();
