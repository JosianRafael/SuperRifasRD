// Configuración de Supabase
const SUPABASE_URL = 'https://hogbufyfyvntczhfibcw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZ2J1ZnlmeXZudGN6aGZpYmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjM2NzcsImV4cCI6MjA5MDEzOTY3N30.YnPuE8yvGDDtT48X35Jb9qz9P2nE92KczOvz1ghyPN8';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentRaffle = null;
let currentQuantity = 1;
let currentPaymentMethod = null;
let selectedVoucherFile = null;
let paymentMethods = [];
let allTickets = [];
let allUsers = [];
let maxPerPerson = 100;
let minPerPerson = 1;  // Nueva variable para el mínimo de boletos por persona

// Obtener ID de la rifa de la URL
const urlParams = new URLSearchParams(window.location.search);
const raffleId = urlParams.get('id');

// Variable para control de términos aceptados
let termsAccepted = false;