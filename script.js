/* ================================
   📁 JSON DATABASE FILES
================================ */

const databaseFiles = {
    cpu: 'data/cpu.json',
    motherboard: 'data/motherboard.json',
    ram: 'data/ram.json',
    gpu: 'data/gpu.json',
    cooler: 'data/cooler.json',
    storage: 'data/storage.json',
    m2: 'data/m2.json',
    psu: 'data/psu.json',
    case: 'data/case.json',
    fan: 'data/fan.json'
}

/* ================================
   🧠 GLOBAL STATE
================================ */

let build = []
let currentCategory = ''
let currentList = []
let recommendationList = []


/* ================================
   📂 OPEN CATEGORY
================================ */

async function openCategory(cat) {
    currentCategory = cat

    hideAllPages()

    document.getElementById('componentPage').style.display = 'block'
    document.getElementById('componentTitle').innerText = 'Select ' + cat.toUpperCase()
    document.getElementById('componentSearch').value = ''

    const response = await fetch(databaseFiles[cat])
    currentList = await response.json()

    render(currentList)
}


/* ================================
   🏠 NAVIGATION
================================ */

function goHome() {
    hideAllPages()
    document.getElementById('categoryPage').style.display = 'block'
}

function hideAllPages() {
    document.getElementById('categoryPage').style.display = 'none'
    document.getElementById('componentPage').style.display = 'none'
    document.getElementById('recommendPage').style.display = 'none'
}


/* ================================
   🧩 RENDER COMPONENT LIST
================================ */

function render(list) {
    const container = document.getElementById('components')
    container.innerHTML = ''

    list.forEach(item => {
        const card = document.createElement('div')
        card.className = 'card'

        let specs = ''
        if (item.socket) specs += `<p>Socket: ${item.socket}</p>`
        if (item.ram) specs += `<p>RAM: ${item.ram}</p>`

        card.innerHTML = `
        <h3>${item.name}</h3>
        ${specs}
        <p class="price">$${item.price}</p>
        <button onclick="addComponent('${item.name}')">Add to Build</button>
        `

        container.appendChild(card)
    })
}


/* ================================
   ➕ ADD COMPONENT TO BUILD
================================ */

function addComponent(name) {
    const item = currentList.find(c => c.name === name)

    const cpu = build.find(b => b.category === 'cpu')
    const motherboard = build.find(b => b.category === 'motherboard')

    let warning = ''

    // 🔧 Compatibility Check
    if (item.category === 'motherboard' && cpu) {
        if (cpu.socket !== item.socket) {
            warning = 'CPU tidak kompatibel dengan motherboard'
        }
    }

    if (item.category === 'cpu' && motherboard) {
        if (motherboard.socket !== item.socket) {
            warning = 'CPU tidak kompatibel dengan motherboard'
        }
    }

    if (item.category === 'ram' && motherboard) {
        if (motherboard.ram !== item.ram) {
            warning = 'RAM tidak kompatibel dengan motherboard'
        }
    }

    if (warning) {
        document.getElementById('warning').innerText = warning
        return
    }

    document.getElementById('warning').innerText = ''

    // 🔁 Check existing item
    const existing = build.find(b => b.name === item.name)

    if (existing) {
        existing.qty += 1
    } else {
        build.push({ ...item, qty: 1 })
    }

    updateBuild()
}


/* ================================
   🔄 UPDATE BUILD LIST
================================ */

function updateBuild() {
    const buildDiv = document.getElementById('build')
    buildDiv.innerHTML = ''

    let total = 0

    build.forEach(i => {
        const div = document.createElement('div')
        div.className = 'build-item'

        div.innerHTML = `
        <span>${i.category.toUpperCase()} - ${i.name} (x${i.qty})</span>
        <span>
        $${i.price * i.qty}
        <button onclick="changeQty('${i.name}',1)">+</button>
        <button onclick="changeQty('${i.name}',-1)">-</button>
        </span>
        `

        buildDiv.appendChild(div)
        total += i.price * i.qty
    })

    document.getElementById('total').innerText = 'Total: $' + total
}


/* ================================
   🔢 CHANGE QUANTITY
================================ */

function changeQty(name, delta) {
    const item = build.find(i => i.name === name)

    if (!item) return

    item.qty += delta

    if (item.qty <= 0) {
        build = build.filter(i => i.name !== name)
    }

    updateBuild()
}


/* ================================
   🔍 SEARCH COMPONENT
================================ */

document.getElementById('componentSearch').addEventListener('input', function () {
    const value = this.value.toLowerCase()

    const filtered = currentList.filter(c =>
        c.name.toLowerCase().includes(value)
    )

    render(filtered)
})


/* ================================
   🗑 CLEAR BUILD
================================ */

function clearBuild() {
    build = []

    document.getElementById('build').innerHTML = ''
    document.getElementById('total').innerText = 'Total: $0'
    document.getElementById('warning').innerText = ''
}

function clearBuild() {
    if (confirm('Yakin mau hapus semua build?')) {
        build = []
        document.getElementById('warning').innerText = ''
        updateBuild()
    }
}


/* ================================
   📄 EXPORT TO PDF
================================ */

async function exportPDF() {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

    let y = 10

    doc.setFontSize(18)
    doc.text("Galaxy PC Builder", 10, y)

    y += 10
    doc.setFontSize(12)
    doc.text("Your PC Build:", 10, y)

    y += 10

    let total = 0

    build.forEach(item => {
        const text = `${item.category.toUpperCase()} - ${item.name} (x${item.qty}) - $${item.price * item.qty}`
        doc.text(text, 10, y)

        y += 8
        total += item.price * item.qty
    })

    y += 5
    doc.setFontSize(14)
    doc.text(`Total: $${total}`, 10, y)

    doc.save("pc-build.pdf")
}


/* ================================
   ⬆ BACK TO TOP BUTTON
================================ */

const backToTopBtn = document.getElementById("backToTop")

window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        backToTopBtn.classList.add("show")
    } else {
        backToTopBtn.classList.remove("show")
    }
})

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    })
}


/* ================================
   📱 WHATSAPP EXPORT
================================ */

function sendToWhatsApp() {

    if (build.length === 0) {
        alert("Build masih kosong!")
        return
    }

    // 🔍 Validation
    const required = ['cpu', 'motherboard', 'ram', 'psu']
    const missing = required.filter(cat => !build.find(b => b.category === cat))

    if (missing.length > 0) {
        alert("Komponen belum lengkap: " + missing.join(", "))
        return
    }

    let message = "🖥️ *Galaxy PC Builder*\n\n"
    message += "Detail Build:\n"

    let total = 0

    build.forEach(item => {
        const subtotal = item.price * item.qty
        message += `- ${item.category.toUpperCase()} : ${item.name} (x${item.qty}) = $${subtotal}\n`
        total += subtotal
    })

    message += "\n💰 *Total: $" + total + "*"

    const encodedMessage = encodeURIComponent(message)
    const phone = "628123456789"

    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank')
}


/* ================================
   ⭐ RECOMMENDATION PAGE
================================ */

async function openRecommendation() {
    hideAllPages()

    document.getElementById('recommendPage').style.display = 'block'

    const res = await fetch('data/recommendation.json')
    const data = await res.json()

    recommendationList = data

    renderRecommendation(data)
}


/* ================================
   🔍 SEARCH RECOMMENDATION
================================ */

document.getElementById('recommendSearch').addEventListener('input', function () {

    const value = this.value.toLowerCase()

    const filtered = recommendationList.filter(r =>
        r.name.toLowerCase().includes(value) ||
        r.creator?.toLowerCase().includes(value)
    )

    renderRecommendation(filtered)
})


/* ================================
   🧩 RENDER RECOMMENDATION
================================ */

function renderRecommendation(list) {
    const container = document.getElementById('recommendList')
    container.innerHTML = ''

    list.forEach(rec => {
        let total = 0
        rec.items.forEach(i => total += i.price)

        const div = document.createElement('div')
        div.className = 'card'

        div.innerHTML = `
        <h3>${rec.name}</h3>
        <p class="creator">👤 ${rec.creator || 'Unknown Creator'}</p>
        <p>Total: $${total}</p>
        <button onclick='applyRecommendation(${JSON.stringify(rec.items)})'>
        Pakai Build Ini
        </button>
        `

        container.appendChild(div)
    })
}


/* ================================
   ⚡ APPLY RECOMMENDATION
================================ */

function applyRecommendation(items) {
    build = items.map(i => ({
        ...i,
        qty: 1
    }))

    updateBuild()
    goHome()
}