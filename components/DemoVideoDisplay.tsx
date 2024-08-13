import clsx from "clsx"
import { useRef, useState } from "react"

type Video = {src: string, text: string, caption: string}

export function DemoVideoDisplay({videos}: {videos: Video[]}) {
  const [selectedVideo, setSelectedVideo] = useState({
    src: "/gdocs2x.webm",
    caption: "Instantly create and embed predictions in Google Docs",
  })

  return (
    <div className="flex flex-row gap-4 max-sm:flex-col-reverse">
      <div className="flex flex-col gap-2 my-auto">
        {videos.map((video) => (
          <button
            key={video.src}
            onClick={() => setSelectedVideo(video)}
            className={clsx(
              "btn",
              selectedVideo.src === video.src && "btn-primary",
            )}
          >
            {video.text}
          </button>
        ))}
      </div>
      <div className="md:w-2/3">
        <DemoVideo
          src={selectedVideo.src}
          caption={selectedVideo.caption}
          key={selectedVideo.src}
        />
      </div>
    </div>
  )
}

function DemoVideo({ src, caption }: { src: string; caption: string }) {
  const ref = useRef<HTMLDivElement | null>(null)

  const [loading, setLoading] = useState(true)
  return (
    <div
      className={clsx(
        "flex flex-col items-center md:max-w-[80vw] mx-auto relative",
      )}
      ref={ref}
    >
      <h2 className="text-center text-xl font-semibold mb-4">
        {caption}
      </h2>
      <video
        muted
        playsInline
        loop
        autoPlay={true}
        controls={false}
        width={992}
        height={576}
        className={clsx("transition-all rounded-lg shadow-2xl")}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
      >
        <source src={src} />
        <source src={src.replace(".webm", ".mov")} /> {/* Safari */}
      </video>
      {loading && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <span className="loading loading-spinner loading-lg translate-y-full opacity-90"></span>
        </div>
      )}
    </div>
  )
}