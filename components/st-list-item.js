class STListItem extends HTMLElement {
    constructor() {
        super()

        this.title = this.getAttribute("title")
        this.link = this.getAttribute("link")
        this.userId = this.getAttribute("user-id")
        this.comment = this.getAttribute("comment")
        this.background = this.getAttribute("background")
    }
}