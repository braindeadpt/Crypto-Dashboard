import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { StyleGuide } from "@/components/desk/StyleGuide";
import { MotionChannels } from "@/components/desk/MotionChannels";
import { MotionProvider } from "@/lib/motion/useMotion";
import { getRegimeBundle } from "@/lib/data/bundle";

export const dynamic = "force-dynamic";

export default async function EstiloPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("style");
  // Leituras reais do dia — o Maestro em /estilo mostra dados verdadeiros.
  const bundle = await getRegimeBundle().catch(() => null);

  const maestro = (
    <MotionProvider
      readings={bundle?.readings ?? null}
      realizedVolPct={bundle?.volRealizedPct ?? null}
    >
      <MotionChannels />
    </MotionProvider>
  );

  return (
    <StyleGuide
      maestro={maestro}
      title={t("title")}
      subtitle={t("subtitle")}
      labels={{
        type: t("type"),
        typeHint: t("typeHint"),
        color: t("color"),
        colorHint: t("colorHint"),
        elevation: t("elevation"),
        elevationHint: t("elevationHint"),
        motion: t("motion"),
        motionHint: t("motionHint"),
        direction: t("direction"),
        regime: t("regime"),
        plates: t("plates"),
        platesHint: t("platesHint"),
        plateSample: t("plateSample"),
        plateNote: t("plateNote"),
        roles: {
          accent: t("roles.accent"),
          up: t("roles.up"),
          down: t("roles.down"),
          calm: t("roles.calm"),
          unsettled: t("roles.unsettled"),
          storm: t("roles.storm"),
          weird: t("roles.weird"),
          focus: t("roles.focus"),
          ink: t("roles.ink"),
          muted: t("roles.muted"),
          bg: t("roles.bg"),
          surface: t("roles.surface"),
        },
        elev: {
          flat: t("elev.flat"),
          raised: t("elev.raised"),
          float: t("elev.float"),
          hero: t("elev.hero"),
        },
        typeSamples: {
          micro: t("typeSamples.micro"),
          label: t("typeSamples.label"),
          meta: t("typeSamples.meta"),
          body: t("typeSamples.body"),
          title: t("typeSamples.title"),
          display: t("typeSamples.display"),
          hero: t("typeSamples.hero"),
          serif: t("typeSamples.serif"),
        },
        deltaSample: t("deltaSample"),
        flashHint: t("flashHint"),
        aaNote: t("aaNote"),
      }}
    />
  );
}
