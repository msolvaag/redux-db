Object.defineProperty(exports, "__esModule", { value: true });
exports.blogPosts = [
    {
        id: 1,
        author: { username: "user1", name: "User 1" },
        body: "......",
        comments: [
            {
                id: 1,
                author: { username: "user2", name: "User 2" },
                comment: ".....",
            },
            {
                id: 2,
                author: { username: "user3", name: "User 3" },
                comment: ".....",
            }
        ]
    },
    {
        id: 2,
        author: { username: "user2", name: "User 2" },
        body: "......",
        comments: [
            {
                id: 3,
                author: { username: "user3", name: "User 3" },
                comment: ".....",
            },
            {
                id: 4,
                author: { username: "user1", name: "User 1" },
                comment: ".....",
            },
            {
                id: 5,
                author: { username: "user3", name: "User 3" },
                comment: ".....",
            }
        ]
    }
];

exports.uniqueData = [
    {
        id: 1,
        postID: 1
    },
    {
        id: 2,
        postID: 2
    }
];