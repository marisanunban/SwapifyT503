import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"

interface User {
  id: number
  name: string
  avatar: string
  status: string
  lastMessage?: string
  time?: string
  online?: boolean
}

interface Message {
  id: number
  senderId: number
  text: string
  time: string
  isSystem?: boolean
}

@Component({
  selector: "app-chat",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.css"],
})
export class ChatComponent {
  newMessage = ""
  currentUser: User = {
    id: 1,
    name: "Rafael Ramaisen",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "Available for freelance work",
    online: true,
  }

  selectedChat = {
    id: 1,
    name: "Beerfest",
    description: "Ideas about the weekend party",
    avatar: "/placeholder.svg?height=40&width=40",
    participants: 5,
  }

  users: User[] = [
    {
      id: 2,
      name: "Manuel Preud",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "Hey Rafael! Can we talk about last co...",
      time: "1 hour",
      online: true,
    },
    {
      id: 3,
      name: "Beerfest",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "Dmitry: I am now here. Nice to meet",
      time: "4 hour",
      online: false,
    },
    {
      id: 4,
      name: "Dmitry Stashov",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "Can you invite me to your conversati!",
      time: "5 hours",
      online: false,
    },
    {
      id: 5,
      name: "Holga Kilbuzim",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "I'm very happy to introduce it!",
      time: "1 day",
      online: false,
    },
    {
      id: 6,
      name: "Hugh Reynolds",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "Sup bro! Can you call me pls?",
      time: "2 days",
      online: false,
    },
    {
      id: 7,
      name: "Ethan Coleman",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "Thanks! Have a nice day!",
      time: "3 days",
      online: false,
    },
  ]

  messages: Message[] = [
    {
      id: 1,
      senderId: 8,
      text: "We can go to the bar we were last Saturday. I like it.",
      time: "3 hours",
    },
    {
      id: 2,
      senderId: 9,
      text: "This is a great idea! We will start from Joe's then we will go to the Fortune Pub and after we will stay at the Natalie's home.",
      time: "3 hours",
    },
    {
      id: 3,
      senderId: 0,
      text: "Rafael Ramaisen has invited Dmitry Stashov.",
      time: "",
      isSystem: true,
    },
    {
      id: 4,
      senderId: 1,
      text: "Hey Dmitry! Welcome to the chat.",
      time: "10 min",
    },
    {
      id: 5,
      senderId: 4,
      text: "Hi everyone!",
      time: "8 min",
    },
    {
      id: 6,
      senderId: 4,
      text: "I am now here. Nice to meet you guys.",
      time: "8 min",
    },
  ]

  sendMessage() {
    if (this.newMessage.trim() === "") return

    this.messages.push({
      id: this.messages.length + 1,
      senderId: this.currentUser.id,
      text: this.newMessage,
      time: "now",
    })

    this.newMessage = ""
  }

  isCurrentUser(senderId: number): boolean {
    return senderId === this.currentUser.id
  }

  getMessageSender(senderId: number): User | undefined {
    if (senderId === this.currentUser.id) {
      return this.currentUser
    }
    return this.users.find((user) => user.id === senderId)
  }
}
