import { NextSeo } from "next-seo"
import Image from "next/image"
import Link from "next/link"
import { GetStaticProps } from "next"
import fs from "fs"
import path from "path"

interface BlogPost {
  slug: string
  title: string
  date: string
  author: string
}

interface BlogPageProps {
  posts: BlogPost[]
}

export const getStaticProps: GetStaticProps<BlogPageProps> = async () => {
  const postsDirectory = path.join(process.cwd(), "pages/blog")
  
  try {
    const filenames = fs.readdirSync(postsDirectory)

    const posts = await Promise.all(filenames
      .filter((filename) => filename.endsWith(".tsx") && filename !== "index.tsx")
      .map(async (filename) => {
        const filePath = path.join(postsDirectory, filename)
        const fileContent = await fs.promises.readFile(filePath, 'utf8')
        
        const metadataMatch = fileContent.match(/export const metadata = ({[\s\S]*?})/)
        let metadata = { title: '', date: '', author: '' }
        
        if (metadataMatch) {
          // Use eval to parse the metadata object (be cautious with this approach in production)
          metadata = eval(`(${metadataMatch[1]})`)
        }

        const slug = filename.replace(".tsx", "")
        return {
          slug,
          title: metadata.title || slug.replace(/-/g, " ").toLowerCase().replace(/^[a-z]/, c => c.toUpperCase()),
          date: metadata.date || '',
          author: metadata.author || ''
        }
      }))

    return {
      props: {
        posts: posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      },
    }
  } catch (error) {
    console.error("Error reading blog posts:", error)
    return {
      props: {
        posts: [],
      },
    }
  }
}

export default function BlogPage({ posts }: BlogPageProps) {
  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title="Blog" />
      <div className="prose mx-auto">
        <h2>Blog posts from the Fatebook team</h2>
        {posts.length > 0 ? (
          <ul>
            {posts.map((post) => (
              <li key={post.slug} className="mb-4">
                <Link
                  href={`/blog/${post.slug}`}
                >
                  {post.title}
                </Link>
                <div className="text-sm text-gray-600">
                  {post.date && <span>{post.date}</span>}
                  {post.date && post.author && <span> • </span>}
                  {post.author && <span>{post.author}</span>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No blog posts found.</p>
        )}

        <Image
          src="/book_scales.webp"
          width={400}
          height={400}
          alt="An open book in front of a scale"
          className="mx-auto"
        />
      </div>
    </div>
  )
}
