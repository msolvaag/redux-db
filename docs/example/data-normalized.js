const normalizedData = {
    User: {
        ids: ["user1", "user2", "user3"],
        byId: {
            "user1": {
                username: "user1",
                name: "User 1"
            },
            "user2": {
                username: "user2",
                name: "User 2"
            }
        }
    },
    BlogPost: {
        ids: ["post1", "post2"],
        byId: {
            "post1": {
                id: "post1",
                author: "user1",
                body: "....."
            },
            "post2": {
                id: "post2",
                author: "user2",
                body: "....."
            }
        }
    },
    Comment: {
        ids: ["comment1", "comment3"],
        byId: {
            "comment1": {
                id: "comment1",
                post: "post1",
                author: "user2",
                comment: "....."
            },
            "comment3": {
                id: "comment3",
                post: "post2",
                author: "user1",
                comment: "....."
            }
        }
    }
}