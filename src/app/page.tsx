import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import WhoToFollow from "@/components/WhoToFollow";
import { currentUser } from "@clerk/nextjs/server";


export default async function Home() {
  const user = await currentUser();
  const dbUserId = await getDbUserId();
  const posts = await getPosts();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
        {user ? <CreatePost /> : null}
        <div className="space-y-6">
          {
            posts.map((post) => (
              <PostCard key={post.id} post={post} dbUserId={dbUserId} />
            ))
          }
        </div>
      </div>
      <div className="hidden lg:col-span-4 lg:block sticky top-20">
        <WhoToFollow />
      </div>
    </div>
  );
}



//app/page.tsx    → /                         Public route
//app/about/page.tsx  → /about                    Public route
//app/blog/page.tsx   → /blog                     Public route
// app/blog/page.tsx    → /blog                         Public route
// app/blog/authors/page.tsx	-> /blog/authors         	Public route
// app/blog/_components/Post.tsx	—>	 NO  routes               Not routable; safe place for UI utilities
// app/blog/_lib/data.ts	—>	 NO  routes               Not routable; safe place for utils

// pages/index.js → /
// pages/blog/index.js  → /blog
// pages/blog/index.js → /blog
// pages/blog/first-post.js → /blog/first-post
// pages/dashboard/settings/username.js → /dashboard/settings/username
// pages/blog/[slug].js	/blog/a	{ slug: 'a' }
// pages/blog/[slug].js	/blog/b	{ slug: 'b' }
// pages/blog/[slug].js	/blog/c	{ slug: 'c' }