"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

export async function createPost(content: string, image: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return;
        const post = await prisma.post.create({
            data: {
                content,
                image,
                authorId: userId,
            }
        })

        revalidatePath("/"); // purge the cache for the home page
        return { success: true, post };

    } catch (error) {
        console.error("Error creating post:", error);
        return { success: false, error: "Error creating post" };

    }
}

export async function getPosts() {
    try {
        const posts = await prisma.post.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        username: true,
                    },
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                username: true,

                            }
                        }
                    },
                    orderBy: {
                        createdAt: "asc",
                    },

                },
                likes: {
                    select: {
                        userId: true,
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                }
            },
        });
        return posts;
    } catch (error) {
        console.log("Error fetching posts:", error);
        throw new Error("Error fetching posts");

    }
}

export async function toggleLike(postId: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return;

        // Check if the like already exists
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });


        const post = await prisma.post.findUnique({
            where: {
                id: postId,
            },
            select: {
                authorId: true,
            }
        })

        if (!post) throw new Error("Post not found");

        if (existingLike) {
            await prisma.like.delete({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });
        } else {
            await prisma.$transaction([
                prisma.like.create({
                    data: {
                        userId,
                        postId,
                    },
                }),
                ...(post.authorId! !== userId ? [
                    prisma.notification.create({
                        data: {
                            type: "LIKE",
                            userId: post.authorId, // recipient (post author)
                            creatorId: userId, // person who liked
                            postId,
                        },
                    }),

                ] : []),

            ]);
        }
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error toggling like:", error);
        return { success: false, error: "Error toggling like" };
    }
}

export async function createComment(postId: string, content: string) {
    try {
        const userId = await getDbUserId();
        if(!userId) return;
        if(!content) throw new Error("Comment content cannot be empty");

        const post = await prisma.post.findUnique({
            where: {
                id: postId,
            },
            select: {
                authorId: true,
            }
        });
        if(!post) throw new Error("Post not found");

        // Create comment and notification in a transaction
        const [comment] = await prisma.$transaction(async (tx) => {
            const newComment = await tx.comment.create({
                data: {
                    content,
                    authorId: userId,
                    postId,
                }
            });
            if(post.authorId !== userId) {
                await tx.notification.create({
                    data: {
                        type: "COMMENT",
                        userId: post.authorId, // post author
                        creatorId: userId, // commenter
                        postId,
                        commentId: newComment.id,
                    }
                });
            }
            return [newComment];
        })
        revalidatePath("/");
        return { success: true, comment };
        
    } catch (error) {
        console.error("Error creating comment:", error);
        return { success: false, error: "Error creating comment" };
        
    }

 }

export async function deletePost(postId: string) { 
    try {
        const userId = await getDbUserId();

        const post = await prisma.post.findUnique({
            where: {
                id: postId,
            },
            select: {
                authorId: true,
            }
        })
        if ( !post ) throw new Error("Post not found");
        if ( post.authorId !== userId ) throw new Error("You are not authorized to delete this post");
        
        await prisma.post.delete({
            where: {
                id: postId,
            }
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error deleting post:", error);
        return { success: false, error: "Error deleting post" };
        
    }
}