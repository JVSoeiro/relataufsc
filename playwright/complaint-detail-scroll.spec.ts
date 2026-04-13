import { expect, test } from "playwright/test";

test("o card do relato rola no mobile e a mídia se move junto com o texto", async ({
  page,
}) => {
  await page.goto("/");

  // Abre um cluster e seleciona um relato para abrir o card de detalhes.
  const cluster = page.locator(".ufsc-cluster-icon").first();
  await expect(cluster).toBeVisible({ timeout: 20_000 });
  await cluster.click();

  const firstItem = page
    .locator(".ufsc-cluster-picker-root .overflow-y-auto button")
    .first();
  await expect(firstItem).toBeVisible();
  await firstItem.click();

  const scroll = page.locator('[data-testid="complaint-detail-scroll"]');
  await expect(scroll).toBeVisible();

  const img = page.locator('img[alt="Mídia do relato"]');
  await expect(img).toBeVisible();

  const before = await img.boundingBox();
  expect(before).toBeTruthy();

  await scroll.evaluate((el) => {
    el.scrollTo({ top: 260, behavior: "instant" });
  });
  const scrollTop = await scroll.evaluate((el) => el.scrollTop);
  expect(scrollTop).toBeGreaterThan(0);

  const after = await img.boundingBox();
  expect(after).toBeTruthy();

  // Se a mídia estiver dentro do mesmo container com overflow, a posição na tela muda ao rolar.
  expect(after!.y).toBeLessThan(before!.y);
});
