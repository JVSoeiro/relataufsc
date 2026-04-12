import { expect, test } from "playwright/test";

test("abre seletor do cluster, mantém ancorado ao arrastar e fecha ao clicar fora", async ({
  page,
}) => {
  await page.goto("/");

  // Aguarda o mapa montar e os markers renderizarem.
  const cluster = page.locator(".ufsc-cluster-icon").first();
  await expect(cluster).toBeVisible({ timeout: 20_000 });

  await cluster.click();

  const picker = page.locator(".leaflet-popup.ufsc-cluster-picker-popup");
  await expect(picker).toBeVisible();
  await expect(picker.getByText("Relatos próximos")).toBeVisible();

  // Arrasta o mapa um pouco; o popup deve continuar aberto (ancorado ao ponto).
  const map = page.locator(".leaflet-container").first();
  const box = await map.boundingBox();
  expect(box).toBeTruthy();

  if (!box) return;

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 90,
    box.y + box.height / 2 + 60,
    { steps: 12 },
  );
  await page.mouse.up();

  await expect(picker).toBeVisible();

  // Clique fora do bloco fecha.
  await page.mouse.click(box.x + 12, box.y + 12);
  await expect(picker).toBeHidden();
});
