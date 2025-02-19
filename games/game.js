class JsPacman extends Game {
  constructor(options = {}) {
    super(options);
    this.shareButton = null;
  }

  showShareButton() {
    if (this.shareButton) return;

    this.shareButton = document.createElement("button");
    this.shareButton.id = "share-button";
    this.shareButton.innerText = "Share on Twitter";
    Object.assign(this.shareButton.style, {
      position: "absolute",
      bottom: "20px",
      left: "20%",
      transform: "translateX(-50%)",
      zIndex: "1000",
      padding: "10px 20px",
      fontSize: "18px",
      fontFamily: "silkscreen",
      background: "linear-gradient(135deg, #ff2975, #8c1eff)",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer"
    });

    this.shareButton.addEventListener("click", () => {
      const tweetText = encodeURIComponent(
        `I just scored ${this.model.score} in FentMan! Can you beat me?`
      );
      const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent("https://fentsports.win")}`;
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
    });

    this.el.appendChild(this.shareButton);
  }

  clearShareButton() {
    if (this.shareButton) {
      this.shareButton.remove();
      this.shareButton = null;
    } else {
      const existingButton = document.getElementById("share-button");
      if (existingButton) {
        existingButton.remove();
      }
    }
  }

  startLevel() {
    this.clearShareButton();
  }

  endGame() {
    // ... your existing game-over logic ...

    this.showShareButton();
  }

  restartGame() {
    this.clearShareButton();
    this.startLevel();
  }
} 