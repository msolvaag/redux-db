Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    User: {
        username: { type: "PK" }
    },
    BlogPost: {
        id: { type: "PK" },
        author: { references: "User", relationName: "posts" },
        computed: { 
            value: (val,ctx) => { 
                return ctx.record.author.value.name; 
            } 
        }
    },
    Comment: {
        id: { type: "PK" },
        post: { references: "BlogPost", relationName: "comments", cascade: true },
        author: { references: "User", relationName: "comments" }
    },
    Unique:{
        id: { type: "PK" },
        postID: { propName: "post", references: "BlogPost", relationName: "unique", unique:true }
    },
    Unique2:{
        id: { type: "PK", propName: "post", references: "BlogPost", relationName: "unique2", unique:true }
    }
};