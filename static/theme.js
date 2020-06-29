const toggleBtn = document.getElementById("theme-toggle")
function toggleTheme() {
    const htmlTag = document.getElementsByTagName('html')[0]
    if (htmlTag.hasAttribute('data-theme')) {
        toggleBtn.innerText = 'الوضع الداكن 🌙'
        htmlTag.removeAttribute('data-theme')
        return window.localStorage.removeItem("site-theme")
    }

    htmlTag.setAttribute('data-theme', 'dark')
    toggleBtn.innerText = 'الوضع الإفتراضى ☀️'
    window.localStorage.setItem("site-theme", "dark")
}

function applyInitialTheme() {
    const theme = window.localStorage.getItem("site-theme")
    if (theme !== null) {
        toggleBtn.innerText = 'الوضع الإفتراضى ☀️'

        const htmlTag = document.getElementsByTagName("html")[0]
        htmlTag.setAttribute("data-theme", theme)
    }
}

applyInitialTheme();

toggleBtn.addEventListener("click", toggleTheme);