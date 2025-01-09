// script.js
document.addEventListener("DOMContentLoaded", () => {
    const apiKey = window.WAF_API_KEY;
    const wafUrl = window.WAF_URL;

    if (!apiKey || !wafUrl) {
        console.error("Les variables WAF_API_KEY et WAF_URL ne sont pas définies correctement.");
        alert("Configuration manquante. Veuillez vérifier les variables d'environnement.");
        return;
    }

    const form = document.getElementById('numberForm');
    const outputDiv = document.getElementById('output');
    const captchaContainer = document.getElementById('my-captcha-container');

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const N = parseInt(document.getElementById('numberInput').value, 10);
        console.log(`Nombre entré : ${N}`);

        // Cacher le formulaire et afficher la zone d'affichage
        form.style.display = 'none';
        outputDiv.style.display = 'block';

        runSequence(N, outputDiv);
    });

    async function runSequence(N, outputDiv) {
        outputDiv.innerHTML = ''; // Vider les résultats précédents
        console.log(`Démarrage de la séquence avec ${N} itérations`);
        for (let i = 1; i <= N; i++) {
            const success = await fetchWithCaptcha(i, outputDiv);
            console.log(`Séquence ${i}: succès = ${success}`);
            if (!success) {
                break; // Arrêter si le CAPTCHA échoue
            }
            await delay(1000); // Attendre 1 seconde entre les requêtes
        }
    }

    async function fetchWithCaptcha(index, outputDiv) {
        try {
            const response = await fetch(wafUrl);
            console.log(`Requête à ${wafUrl} avec réponse ${response.status}`);
            if (response.ok) {
                addOutputLine(outputDiv, `${index}. OK`);
                return true;
            } else if (response.status === 403) {
                return await showCaptcha(outputDiv, index);
            } else {
                addOutputLine(outputDiv, `${index}. Erreur ${response.status}`);
            }
        } catch (error) {
            console.error('Erreur lors de la requête :', error);
            addOutputLine(outputDiv, `${index}. Erreur de requête`);
        }
        return false;
    }
    

    function showCaptcha(outputDiv, index) {
        return new Promise((resolve) => {
            console.log(`Affichage du CAPTCHA pour la séquence ${index}`);
            captchaContainer.style.display = 'block'; // Afficher le conteneur CAPTCHA
            AwsWafCaptcha.renderCaptcha(captchaContainer, {
                apiKey: apiKey,
                onSuccess: (wafToken) => {
                    console.log(`CAPTCHA résolu avec succès pour la séquence ${index}`);
                    captchaContainer.style.display = 'none'; // Cacher le conteneur CAPTCHA
                    fetch(wafUrl, {
                        method: "POST",
                        headers: {
                            'Authorization': `Bearer ${wafToken}`,
                        }
                    }).then(() => {
                        addOutputLine(outputDiv, `${index}. CAPTCHA Passed`);
                        resolve(true); // Continuer la séquence
                    }).catch((error) => {
                        console.error('Erreur lors de la résolution du CAPTCHA :', error);
                        captchaContainer.style.display = 'none'; // Cacher le conteneur CAPTCHA
                        resolve(false); // Arrêter la séquence
                    });
                },
                onError: (error) => {
                    console.error('Erreur avec le CAPTCHA :', error);
                    captchaContainer.style.display = 'none'; // Toujours cacher le CAPTCHA
                    resolve(false); // Arrêter la séquence
                },
            });
        });
    }
    
    function addOutputLine(container, text) {
        console.log(`Ajout de ligne dans l'output : ${text}`);
        container.innerHTML += `${text}<br>`;
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
});
