import { supabase } from "./supabase.js";

const tablaBody = document.querySelector("#tabla-citas tbody");
const filtroFecha = document.getElementById("filtro-fecha");
const filtroEstado = document.getElementById("filtro-estado");
const buscador = document.getElementById("buscador");
const btnFiltrar = document.getElementById("btn-filtrar");
const btnLimpiar = document.getElementById("btn-limpiar");
const btnExportar = document.getElementById("btn-exportar");
const logoutBtn = document.getElementById("logout-btn");

let citas = [];

// 🔧 PRIMERO funciones para cargar y actualizar
async function cargarCitas() {
  let query = supabase
    .from("citas", { head: false }) // 👈 Fuerza a traer datos completos)
    .select("*")
    .order("fecha", { ascending: true });

  if (filtroFecha.value) query = query.eq("fecha", filtroFecha.value);
  if (filtroEstado.value) query = query.eq("estado", filtroEstado.value);

  const { data, error } = await query.throwOnError();
  if (error) {
    console.error("Error cargando citas:", error);
    return;
  }

  citas = data ? [...data] : [];
  actualizarEstadisticas();
  renderizarTabla();
}

function actualizarEstadisticas() {
  document.getElementById("total-citas").textContent = citas.length;
  document.getElementById("citas-confirmadas").textContent = citas.filter(
    (c) => c.estado === "confirmada"
  ).length;
  document.getElementById("citas-pendientes").textContent = citas.filter(
    (c) => c.estado === "pendiente" || !c.estado
  ).length;
}

function renderizarTabla() {
  const textoBusqueda = buscador.value.toLowerCase().trim();
  const citasFiltradas = citas.filter(
    (c) =>
      c.nombre.toLowerCase().includes(textoBusqueda) ||
      c.email.toLowerCase().includes(textoBusqueda) ||
      (c.telefono || "").toLowerCase().includes(textoBusqueda)
  );

  tablaBody.innerHTML = "";
  citasFiltradas.forEach((cita) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${cita.nombre}</td>
      <td>${cita.email}</td>
      <td>${cita.telefono || ""}</td>
      <td>${cita.fecha}</td>
      <td>${cita.hora}</td>
      <td>${cita.motivo || ""}</td>
      <td><span class="estado ${cita.estado || "pendiente"}">${
      cita.estado || "pendiente"
    }</span></td>
      <td>
        <button class="btn-accion confirmar" data-id="${cita.id}">✅</button>
        <button class="btn-accion cancelar" data-id="${cita.id}">❌</button>
      </td>
    `;
    tablaBody.appendChild(fila);
  });
}

async function actualizarEstado(id, nuevoEstado) {
  const { error } = await supabase
    .from("citas")
    .update({ estado: nuevoEstado })
    .eq("id", id);

  if (error) {
    console.error("Error actualizando estado:", error);
    return;
  }

  // Refrescamos el array local sin esperar la recarga
  citas = citas.map((c) => (c.id == id ? { ...c, estado: nuevoEstado } : c));
  actualizarEstadisticas();
  renderizarTabla();

  await cargarCitas(); // asegura sincronización con DB
}

async function eliminarCita(id) {
  const { error } = await supabase.from("citas").delete().eq("id", id);
  if (error) {
    console.error("Error eliminando cita:", error);
    return;
  }

  // Eliminamos localmente
  citas = citas.filter((c) => c.id != id);
  actualizarEstadisticas();
  renderizarTabla();

  await cargarCitas();
}

// 🔧 AHORA asignamos eventos (ya existen las funciones)
tablaBody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("confirmar")) {
    await actualizarEstado(e.target.dataset.id, "confirmada");
  } else if (e.target.classList.contains("cancelar")) {
    await eliminarCita(e.target.dataset.id);
  }
});

btnFiltrar.addEventListener("click", cargarCitas);
btnLimpiar.addEventListener("click", () => {
  filtroFecha.value = "";
  filtroEstado.value = "";
  buscador.value = "";
  cargarCitas();
});

buscador.addEventListener("input", renderizarTabla);
btnExportar.addEventListener("click", () => exportarExcel(citas));

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

function exportarExcel(data) {
  if (!data.length) return alert("No hay citas para exportar.");
  import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs").then(
    (XLSX) => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Citas");
      XLSX.writeFile(wb, "citas.xlsx");
    }
  );
}

// 👇 Ejecutar carga inicial
document.addEventListener("DOMContentLoaded", cargarCitas);

// 👇 Suscripción en tiempo real
supabase
  .channel("citas-changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "citas" },
    (payload) => {
      console.log("Cambio detectado en citas:", payload);
      cargarCitas();
    }
  )
  .subscribe();

let deferredPrompt;
const btnInstalar = document.getElementById("btnInstalar");

// Detectar si ya está instalada
window.addEventListener("appinstalled", () => {
  console.log("PWA instalada");
  btnInstalar.style.display = "none";
});

// Evento que indica que la PWA se puede instalar
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault(); // evita el popup automático
  deferredPrompt = event;

  // Mostrar botón SOLO si NO está instalada
  if (window.matchMedia("(display-mode: standalone)").matches === false) {
    btnInstalar.style.display = "block";
  }

  btnInstalar.onclick = async () => {
    btnInstalar.style.display = "none";
    deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;
    console.log("Instalación:", choice.outcome);

    deferredPrompt = null;
  };
});

// Detectar si ya está en modo standalone (instalada y abierta)
if (window.matchMedia("(display-mode: standalone)").matches) {
  btnInstalar.style.display = "none";
}
