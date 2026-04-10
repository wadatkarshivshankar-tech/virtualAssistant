const express = require("express")
const dotenv = require("dotenv")
dotenv.config()
const cors = require("cors")
const cookieParser = require("cookie-parser")
const main = require("./utils/database")
const authRouter = require("./routes/authrouter")
const userRouter = require("./routes/userrouter")

const app = express()

app.use(cors({
    origin: "http://localhost:5174",
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)

const port = process.env.PORT || 5000

main().then(() => {
    app.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })
})