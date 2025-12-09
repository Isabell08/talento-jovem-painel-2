document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------
    // 1. Variáveis Globais e Configurações
    // ----------------------------------------------------------------
    
    // Definição das Telas (Conteúdo injetável)
    const screens = {
        home: `
            <div class="card">
                <h2 style="color:var(--neon-orange);">Olá, <span id="home-user-name"></span>!</h2>
                <p style="color:var(--text-secondary); font-size:1.1em; margin-bottom:15px;">Bem-vindo(a) ao seu Painel de Adaptação Acelerada. Seu progresso é fundamental.</p>
            </div>
            <div class="card metric-card">
                <h3>📈 Resumo da Jornada</h3>
                <p>Progresso Médio (Maturidade): <span id="avg-progress" style="color:var(--neon-cyan);">0%</span></p>
                <p>Dias na Trilha: <span id="days-on-track" style="color:var(--neon-cyan);">0</span></p>
                <button class="btn-primary" onclick="window.navigate('profile')">Criar ou Atualizar Perfil</button>
                <button class="btn-secondary" onclick="window.navigate('trilha')">Ver Minha Trilha</button>
            </div>
        `,
        profile: `
            <div class="card">
                <h2>🧬 Configuração de Perfil</h2>
                <form id="profile-form">
                    <label for="p-name">Nome Completo do Candidato</label>
                    <input type="text" id="p-name" required placeholder="Ex: Maria da Silva">

                    <label for="p-hardskills">Hard Skills (Competências Técnicas)</label>
                    <textarea id="p-hardskills" rows="2" placeholder="Ex: Excel, Python Básico, Análise de Dados" required></textarea>

                    <label for="p-softskills">Soft Skills a Desenvolver (Dores Pessoais)</label>
                    <textarea id="p-softskills" rows="2" placeholder="Ex: Falar em público, Negociação, Gestão de Tempo" required></textarea>

                    <label for="p-objective">Objetivo Primário da Trilha</label>
                    <select id="p-objective" required>
                        <option value="adaptacao">1. Adaptação Rápida (Pós-Contratação)</option>
                        <option value="promocao">2. Foco em Promoção/Crescimento</option>
                        <option value="networking">3. Fortalecimento de Networking</option>
                    </select>
                    
                    <label for="p-hours">Disponibilidade Semanal para Aprendizagem (horas)</label>
                    <input type="number" id="p-hours" min="1" max="40" value="5" required>

                    <button type="submit" class="btn-primary">GERAR PLANO DE 30 DIAS!</button>
                </form>
            </div>
        `,
        trilha: `
            <div class="card">
                <h2>🗂️ Trilha Personalizada de 30 Dias</h2>
                <p id="trilha-status" style="color:var(--text-secondary); margin-bottom: 20px;">Carregando o plano...</p>
                <ul class="trilha-list" id="trilha-list-container"></ul>
                <button class="btn-secondary" id="export-trilha-btn" style="display:none;">Exportar Plano (JSON)</button>
            </div>
        `,
        dashboard: `
            <div class="card">
                <h2>📊 Dashboard de Evolução</h2>
                <h3>Maturidade Profissional (%)</h3>
                <canvas id="progress-chart"></canvas>
                <p style="text-align:center; margin-top:15px;">Pontuação de Maturidade Atual: <span id="maturity-score" style="color:var(--neon-orange); font-weight:700;">0</span></p>
                <button class="btn-secondary" id="simulate-btn">Simular Avanço de Progresso</button>
            </div>
        `
    };

    const storageKey = 'tj_user_data_v2';
    let userData = {};

    // ----------------------------------------------------------------
    // 2. Funções de Armazenamento e Inicialização
    // ----------------------------------------------------------------

    const loadUserData = () => {
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
            userData = JSON.parse(storedData);
        } else {
            // Estrutura padrão para novo usuário/primeiro acesso
            userData = {
                loggedIn: false,
                name: 'Candidato',
                avatar: 'default-avatar.png',
                profile: {},
                trilha: [],
                progress: { days: 0, score: 0, history: [0] },
                theme: 'glow-mode' // Default theme
            };
        }
        document.body.className = userData.theme;
    };

    const saveUserData = () => {
        localStorage.setItem(storageKey, JSON.stringify(userData));
        updateUI();
    };

    // ----------------------------------------------------------------
    // 3. Funções de Navegação e UI
    // ----------------------------------------------------------------

    const updateUI = () => {
        // Atualiza elementos globais (Header)
        document.getElementById('user-name-display').textContent = userData.name || 'Candidato';
        document.getElementById('user-avatar').src = userData.avatar || 'default-avatar.png';
        
        // Atualiza Home
        const homeName = document.getElementById('home-user-name');
        if (homeName) homeName.textContent = userData.name || 'Jovem Talento';

        const avgProgress = document.getElementById('avg-progress');
        if (avgProgress) avgProgress.textContent = `${Math.round(userData.progress.score)}%`;

        const daysOnTrack = document.getElementById('days-on-track');
        if (daysOnTrack) daysOnTrack.textContent = userData.progress.days;

        // Aplica o tema
        document.body.className = userData.theme;
    };

    const navigate = (screenName) => {
        const screenView = document.getElementById('screen-view');
        
        // Simulação de transição iOS/aplicativo
        screenView.style.transform = 'translateY(-10px)';
        screenView.style.opacity = '0';

        setTimeout(() => {
            // Carrega novo conteúdo
            screenView.innerHTML = `<div class="current-screen">${screens[screenName]}</div>`;
            screenView.scrollTop = 0;

            // Configuração de tela específica
            if (screenName === 'trilha') renderTrilha();
            if (screenName === 'dashboard') drawChart();
            if (screenName === 'profile') setupProfileForm();

            // Atualiza botões de navegação
            document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`.nav-button[data-screen="${screenName}"]`).classList.add('active');
            
            // Retorna a transição
            screenView.style.transform = 'translateY(0)';
            screenView.style.opacity = '1';

            updateUI();
        }, 300);
    };
    
    // Torna a função de navegação global para ser chamada nos botões injetados (onclick)
    window.navigate = navigate;

    // ----------------------------------------------------------------
    // 4. Lógica de Perfil e Geração de Trilha
    // ----------------------------------------------------------------

    const setupLoginAndAvatar = () => {
        const avatarImg = document.getElementById('user-avatar');
        const avatarInput = document.getElementById('avatar-input');

        avatarImg.addEventListener('click', () => {
            // Se não estiver logado, pede o nome para simular o login
            if (!userData.loggedIn) {
                const newName = prompt("PAINEL DE LOGIN:\n\nDigite o nome do Candidato (ou nome de teste) para iniciar a sessão:");
                if (newName) {
                    userData.name = newName.toUpperCase();
                    userData.loggedIn = true;
                    saveUserData();
                } else {
                    return;
                }
            }
            // Dispara o input de arquivo para trocar o avatar
            avatarInput.click();
        });

        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    userData.avatar = reader.result;
                    saveUserData();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const setupProfileForm = () => {
        const form = document.getElementById('profile-form');
        if (!form) return;

        // Pré-preenche o formulário com dados existentes
        document.getElementById('p-name').value = userData.profile.name || userData.name || '';
        document.getElementById('p-hardskills').value = userData.profile.hardskills || '';
        document.getElementById('p-softskills').value = userData.profile.softskills || '';
        document.getElementById('p-objective').value = userData.profile.objective || 'adaptacao';
        document.getElementById('p-hours').value = userData.profile.hours || 5;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // 1. Salva Dados do Perfil
            userData.profile = {
                name: document.getElementById('p-name').value,
                hardskills: document.getElementById('p-hardskills').value,
                softskills: document.getElementById('p-softskills').value,
                objective: document.getElementById('p-objective').value,
                hours: parseInt(document.getElementById('p-hours').value)
            };
            userData.name = userData.profile.name.toUpperCase();
            userData.loggedIn = true;

            // 2. Gera Trilha de 30 dias (função principal)
            userData.trilha = generateTrilha(userData.profile);
            
            // 3. Reseta métricas para nova trilha
            userData.progress = { days: 0, score: 0, history: [0] };

            saveUserData();
            alert('Plano gerado! Sua nova Trilha de 30 dias está pronta. Siga para a próxima tela.');
            navigate('trilha');
        });
    }

    const generateTrilha = (profile) => {
        const trilha = [];
        const softSkillsArray = profile.softskills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const coreSkills = ['Comunicação Profissional', 'Gestão de Feedback', 'Negociação de Prazos', 'Postura Corporativa'];
        
        for (let i = 1; i <= 30; i++) {
            let activity = '';
            let difficulty = 'easy';
            const randomSkill = softSkillsArray[i % softSkillsArray.length] || 'Autonomia';

            if (i % 7 === 0) {
                activity = `DESAFIO SEMANAL: Prepare e apresente um relatório rápido (3 min) para aplicar ${randomSkill}.`;
                difficulty = 'hard';
            } else if (i % 5 === 0) {
                const coreSkill = coreSkills[(i / 5) % coreSkills.length];
                activity = `MÓDULO PRÁTICO: Estude o guia da Biblioteca sobre '${coreSkill}' e crie um script de uso.`;
                difficulty = 'medium';
            } else if (i % 3 === 0) {
                activity = `CONTEÚDO: Utilize 15 minutos para analisar como '${profile.objective}' se relaciona com ${randomSkill}.`;
                difficulty = 'easy';
            } else {
                activity = `REFLEXÃO: Avalie a dor do dia de hoje no ambiente de trabalho e anote como a plataforma poderia ajudar.`;
                difficulty = 'easy';
            }

            trilha.push({
                day: i,
                activity: activity,
                difficulty: difficulty,
                completed: false
            });
        }
        return trilha;
    }

    const renderTrilha = () => {
        const container = document.getElementById('trilha-list-container');
        const status = document.getElementById('trilha-status');
        container.innerHTML = '';

        if (userData.trilha.length === 0) {
            status.textContent = 'Trilha não gerada. Por favor, preencha o Perfil.';
            document.getElementById('export-trilha-btn').style.display = 'none';
            return;
        }

        status.textContent = `Clique nas atividades para marcar como concluídas. ${userData.trilha.filter(i => i.completed).length} de 30 concluídas.`;
        document.getElementById('export-trilha-btn').style.display = 'block';

        userData.trilha.forEach(item => {
            const li = document.createElement('li');
            li.className = item.completed ? 'completed' : '';
            li.innerHTML = `
                <span style="color:var(--neon-orange); font-weight:600;">DIA ${item.day}:</span> ${item.activity}
                <span class="badge badge-${item.difficulty}">${item.difficulty.toUpperCase()}</span>
            `;
            li.addEventListener('click', () => toggleTrilhaCompletion(item.day));
            container.appendChild(li);
        });

        document.getElementById('export-trilha-btn').addEventListener('click', exportTrilha);
    }

    const toggleTrilhaCompletion = (day) => {
        const index = day - 1;
        if (index >= 0 && index < userData.trilha.length) {
            userData.trilha[index].completed = !userData.trilha[index].completed;
            updateProgressMetrics();
            saveUserData();
            renderTrilha();
        }
    }

    const updateProgressMetrics = () => {
        const completed = userData.trilha.filter(item => item.completed).length;
        const total = userData.trilha.length;
        const newScore = total > 0 ? (completed / total) * 100 : 0;
        
        userData.progress.score = newScore;
        userData.progress.days = completed;
        
        // Adiciona o novo score apenas se for diferente para o gráfico
        const lastScoreInHistory = userData.progress.history.slice(-1)[0];
        if (Math.round(newScore) !== lastScoreInHistory) {
             // Limita a 10 pontos no histórico para não sobrecarregar o gráfico
             if (userData.progress.history.length > 10) userData.progress.history.shift();
             userData.progress.history.push(Math.round(newScore));
        }
    }

    // ----------------------------------------------------------------
    // 5. Dashboard e Gráfico (Canvas Puro)
    // ----------------------------------------------------------------
    
    const drawChart = () => {
        const canvas = document.getElementById('progress-chart');
        if (!canvas) return;

        // Configuração de cores ajustadas
        const neonCyan = '#00E5FF';
        const neonOrange = '#FF9900';

        const ctx = canvas.getContext('2d');
        // Garante que o Canvas se ajuste ao card
        canvas.width = canvas.parentElement.offsetWidth - 60; // Padding do card
        canvas.height = 250;

        const history = userData.progress.history;
        const pointCount = history.length;
        const xStep = canvas.width / (pointCount > 1 ? pointCount - 1 : 1);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('maturity-score').textContent = Math.round(userData.progress.score);

        const getY = (score) => canvas.height - (score / 100) * canvas.height;

        // 1. Draw Line (Neon Cyan)
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = neonCyan;
        ctx.shadowColor = neonCyan;
        ctx.shadowBlur = 10;
        
        history.forEach((score, i) => {
            const x = i * xStep;
            const y = getY(score);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();

        // 2. Draw Glow Shadow (Orange)
        ctx.shadowColor = neonOrange;
        ctx.shadowBlur = 15;
        ctx.stroke();

        // 3. Draw Points (Neon Orange)
        history.forEach((score, i) => {
            const x = i * xStep;
            const y = getY(score);

            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = neonOrange;
            ctx.shadowColor = neonOrange;
            ctx.shadowBlur = 8;
            ctx.fill();
        });
        
        // Remove glow for subsequent drawings
        ctx.shadowBlur = 0;
    }

    const simulateProgress = () => {
        if (userData.trilha.length === 0) {
            alert("Gere uma trilha primeiro (Aba Perfil)!");
            return;
        }
        
        // Avança automaticamente 3 dias da trilha e simula aumento de score
        let daysCompleted = 0;
        for (let i = 0; i < userData.trilha.length && daysCompleted < 3; i++) {
            if (!userData.trilha[i].completed) {
                 userData.trilha[i].completed = true;
                 daysCompleted++;
            }
        }

        if (daysCompleted > 0) {
             updateProgressMetrics();
             saveUserData();
             alert(`Simulação de ${daysCompleted} dias de trabalho concluída! Score atualizado.`);
             navigate('dashboard');
        } else {
             alert("Parabéns, você já concluiu ou quase concluiu a trilha!");
        }
    }
    
    // Torna a função global para ser usada no Dashboard
    window.simulateProgress = simulateProgress;

    // ----------------------------------------------------------------
    // 6. Funções de Exportação (Demonstração)
    // ----------------------------------------------------------------

    const exportData = (data, filename) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", filename + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert('Dados exportados com sucesso!');
    }

    const exportTrilha = () => {
        exportData(userData.trilha, `trilha_talento_jovem_${userData.name.split(' ')[0]}`);
    }

    // ----------------------------------------------------------------
    // 7. Inicialização do App e Event Listeners
    // ----------------------------------------------------------------

    const init = () => {
        loadUserData();
        
        // 1. Remove Loader e exibe o App após a simulação de carga
        setTimeout(() => {
            document.getElementById('loader').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loader').style.display = 'none';
                document.getElementById('app-container').classList.remove('hidden');
                navigate('home'); // Navega para a tela inicial
            }, 500);
        }, 1500);

        // 2. Setup Listeners
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', (e) => {
                navigate(e.currentTarget.dataset.screen);
            });
        });

        document.getElementById('theme-toggle').addEventListener('click', () => {
            userData.theme = userData.theme === 'glow-mode' ? 'calm-mode' : 'glow-mode';
            saveUserData();
        });
        
        // 3. Setup Login/Avatar
        setupLoginAndAvatar();
    };

    init();
});
