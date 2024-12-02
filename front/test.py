with open("static/emoji.txt", "r", encoding="utf-8") as file:
    emojis = file.read()
    print(emojis.split(','))
