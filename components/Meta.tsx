import { DefaultSeo } from "next-seo"

export default function Meta() {
  return (
    <DefaultSeo
      titleTemplate="%s - Fatebook"
      defaultTitle="Fatebook"
      description="Track your predictions, make better decisions."
      canonical="https://fatebook.io/"
      openGraph={{
        type: "website",
        locale: "en_US",
        url: "https://fatebook.io/",
        title: "Fatebook",
        description: "Track your predictions, make better decisions.",
        siteName: "Fatebook",
        images: [
          {
            url: "https://fatebook.io/telescope_future_1200_white.png",
            width: 1200,
            height: 686,
            alt: "",
          },
        ],
      }}
      additionalLinkTags={[
        {
          rel: "icon",
          href: "https://fatebook.io/scale.svg",
        },
      ]}
    />
  )
}
