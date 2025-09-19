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

async function cargarCitas() {
  let query = supabase
    .from("citas")
    .select("*")
    .order("fecha", { ascending: true });

  if (filtroFecha.value) query = query.eq("fecha", filtroFecha.value);
  if (filtroEstado.value) query = query.eq("estado", filtroEstado.value);

  const { data, error } = await query;
  if (error) {
    console.error("Error cargando citas:", error);
    return;
  }
  citas = data;
  actualizarEstadisticas();
  renderizarTabla();
}

function actualizarEstadisticas() {
  document.getElementById("total-citas").textContent = citas.length;
  document.getElementById("citas-confirmadas").textContent = citas.filter(
    (c) => c.estado === "confirmada"
  ).length;
  document.getElementById("citas-canceladas").textContent = citas.filter(
    (c) => c.estado === "cancelada"
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
            <button class="btn-accion confirmar" data-id="${
              cita.id
            }">✅</button>
            <button class="btn-accion cancelar" data-id="${cita.id}">❌</button>
          </td>
        `;
    tablaBody.appendChild(fila);
  });
}

tablaBody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("confirmar")) {
    await actualizarEstado(e.target.dataset.id, "confirmada");
  } else if (e.target.classList.contains("cancelar")) {
    await actualizarEstado(e.target.dataset.id, "cancelada");
  }
});

async function actualizarEstado(id, nuevoEstado) {
  const { error } = await supabase
    .from("citas")
    .update({ estado: nuevoEstado })
    .eq("id", id);
  if (error) console.error("Error actualizando estado:", error);
  cargarCitas();
}

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
/*
(async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) window.location.href = "index.html";
  else cargarCitas();
})();
*/
// 👇 Esto hace que se carguen las citas al abrir la página
// 👇 Cargar las citas al inicio
document.addEventListener("DOMContentLoaded", cargarCitas);

// 👇 Suscripción en tiempo real a cambios en la tabla "citas"
supabase
  .channel("citas-changes") // nombre de canal (puedes poner cualquiera)
  .on(
    "postgres_changes",
    {
      event: "*", // escucha inserts, updates y deletes
      schema: "public",
      table: "citas",
    },
    (payload) => {
      console.log("Cambio detectado en citas:", payload);
      cargarCitas(); // recarga la tabla al instante
    }
  )
  .subscribe();
let deferredPrompt; // Guardará el evento de instalación

window.addEventListener("beforeinstallprompt", (e) => {
  // Evita que el navegador muestre el banner por defecto
  e.preventDefault();
  deferredPrompt = e;

  // Muestra tu propio mensaje o botón
  const installBtn = document.getElementById("btn-instalar");
  installBtn.style.display = "block";

  installBtn.addEventListener("click", async () => {
    installBtn.style.display = "none"; // Oculta el botón

    if (deferredPrompt) {
      deferredPrompt.prompt(); // Muestra el prompt de instalación
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Usuario eligió: ${outcome}`);
      deferredPrompt = null; // Resetea para evitar duplicados
    }
  });
});
