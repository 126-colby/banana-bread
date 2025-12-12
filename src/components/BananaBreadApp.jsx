import { useState, useEffect, useRef } from 'react';

const KEY_INGS = 'banana_bread_ings_v3';
const KEY_STEPS = 'banana_bread_steps_v3';
const ONE_DAY = 24 * 60 * 60 * 1000;

const save = (key, data) => {
    localStorage.setItem(key, JSON.stringify({
        data,
        expiry: Date.now() + ONE_DAY
    }));
};

const load = (key) => {
    try {
        const stored = JSON.parse(localStorage.getItem(key));
        if (!stored || Date.now() > stored.expiry) return {};
        return stored.data;
    } catch { return {}; }
};

async function callGemini(prompt, imageBase64 = null) {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, imageBase64 })
        });
        const data = await response.json();
        
        if (data.error) {
            return data.error;
        }
        
        return data.text || "Gemini couldn't process that.";
    } catch (error) {
        return "Error connecting to Gemini. Please try again.";
    }
}

const INGREDIENTS = [
    { name: 'Eggs (Large, Room Temp)', amount: '2', unit: '', sub: 'Flax eggs' },
    { name: 'Buttermilk', amount: '1/3', unit: 'cup', sub: 'Milk + 1tsp vinegar' },
    { name: 'Vegetable Oil', amount: '1/2', unit: 'cup', sub: 'Melted butter or applesauce' },
    { name: 'Mashed Bananas', amount: '1', unit: 'cup', sub: 'Approx 2-3 very ripe bananas' },
    { name: 'Vanilla Extract', amount: '1', unit: 'tsp', sub: '' },
    { name: 'White Sugar', amount: '1 1/2', unit: 'cups', sub: 'Brown sugar (use less)' },
    { name: 'All-Purpose Flour', amount: '1 3/4', unit: 'cups', sub: 'Bread flour' },
    { name: 'Baking Soda', amount: '1', unit: 'tsp', sub: '' },
    { name: 'Salt', amount: '1/2', unit: 'tsp', sub: '' }
];

const STEPS = [
    { title: 'Prep Bananas', text: 'Mash thoroughly in a separate bowl. Measure exactly 1 cup.', critical: false, aiPrompt: "Why is it important to measure exactly 1 cup of mashed bananas for banana bread? What happens if I use too much?" },
    { title: 'Liquids First', text: 'Remove pan from machine. Install paddle. Pour in: Oil, Buttermilk, Beaten Eggs, Vanilla, and Mashed Bananas.', critical: true, aiPrompt: "Why must I put liquid ingredients first in an Amazon Basics bread machine? What happens if I put flour first?" },
    { title: 'Dry Ingredients', text: 'Add gently on top: Sugar, Flour, Salt, Baking Soda. (Make a small well for the soda).', critical: false, aiPrompt: "Why should I keep baking soda away from the wet ingredients until mixing starts in a quick bread?" },
    { title: 'Select Program', text: 'Place pan in machine. Lock it. Select Program 9 (CAKE).', critical: true, aiPrompt: "Why should I use the 'Cake' setting instead of 'Quick Bread' for banana bread in an Amazon Basics machine?" },
    { title: 'Scrape Down', text: 'After 5-10 mins of mixing, use a spatula to scrape flour from the corners of the pan.', critical: true, aiPrompt: "Why is scraping the corners necessary for bread machine quick breads compared to yeast breads?" },
    { title: 'Bake & Check', text: 'When done, do the toothpick test. If wet, use Program 13 (Bake) for 10-15 more mins.', critical: true, aiPrompt: "My banana bread is still wet in the middle after the cycle. Why does this happen and how does the 'Bake' only cycle fix it?" },
    { title: 'Cool', text: 'Remove with mitts. Cool in pan 10 mins, then transfer to wire rack.', critical: false }
];

export default function BananaBreadApp() {
    const [checkedIngs, setCheckedIngs] = useState(() => load(KEY_INGS));
    const [checkedSteps, setCheckedSteps] = useState(() => load(KEY_STEPS));

    const [stepTips, setStepTips] = useState({});
    const [loadingTips, setLoadingTips] = useState({});

    const [imgPreview, setImgPreview] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const fileInput = useRef(null);

    const [variation, setVariation] = useState(null);
    const [generatingVar, setGeneratingVar] = useState(false);

    const [bananaCount, setBananaCount] = useState(3);

    useEffect(() => save(KEY_INGS, checkedIngs), [checkedIngs]);
    useEffect(() => save(KEY_STEPS, checkedSteps), [checkedSteps]);

    const toggleIng = (idx) => {
        setCheckedIngs(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const toggleStep = (idx) => {
        setCheckedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const askGeminiStep = async (e, index, prompt) => {
        e.stopPropagation();
        if (stepTips[index]) {
            setStepTips(prev => {
                const newState = {...prev};
                delete newState[index];
                return newState;
            });
            return;
        }

        setLoadingTips(prev => ({ ...prev, [index]: true }));
        const response = await callGemini(prompt + " Keep the answer concise (under 40 words) and helpful.");
        setLoadingTips(prev => ({ ...prev, [index]: false }));
        setStepTips(prev => ({ ...prev, [index]: response }));
    };

    const handleCamera = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImgPreview(ev.target.result);
                setAnalysis(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = async () => {
        setAnalyzing(true);
        const prompt = "Look at these bananas. Are they ripe enough for banana bread? If green, say wait. If yellow, suggest adding sugar. If spotted/black, say they are perfect. Be brief and fun. Address the user directly.";
        const response = await callGemini(prompt, imgPreview);
        setAnalysis(response);
        setAnalyzing(false);
    };

    const generateVariation = async () => {
        setGeneratingVar(true);
        const prompt = "Suggest ONE creative, unique flavor variation for banana bread that works in a bread machine. List 2 extra ingredients to add. Keep it short.";
        const response = await callGemini(prompt);
        setVariation(response);
        setGeneratingVar(false);
    };

    const requiresBatching = bananaCount >= 4 && bananaCount <= 6;

    return (
        <div className="container">
            <img src="https://imagedelivery.net/guDBhnmcqEWgPQ1LAcR2gg/fb794af4-6209-4efd-4ad3-18a9db08ef00/public" alt="Banana Bread" className="hero-image" />

            <h1>Tailored "Best Ever" Banana Bread</h1>
            <p style={{textAlign: 'center', fontStyle: 'italic', color: '#666'}}>Adapted for Amazon Basics 2lb Machine (Program 9)</p>

            <div className="ripeness-checker">
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px'}}>
                    <span style={{fontSize: '2rem'}}>🍌</span>
                    <div>
                        <h3 style={{margin: 0}}>✨ AI Ripe-o-Meter</h3>
                        <p style={{margin: 0, fontSize: '0.9em'}}>Scan your bananas to check sugar levels</p>
                    </div>
                </div>

                <div style={{marginBottom: '20px'}}>
                    <img src="https://imagedelivery.net/guDBhnmcqEWgPQ1LAcR2gg/5a68c5d8-214a-490c-c9fe-9ab45e661100/public" alt="Banana Ripeness Guide" style={{width: '60%', margin: '0 auto', display: 'block', borderRadius: '8px', border: '1px solid #ddd'}} />
                </div>

                <input type="file" accept="image/*" capture="environment" ref={fileInput} style={{display:'none'}} onChange={handleCamera} />

                <button className="camera-btn" onClick={() => fileInput.current.click()}>
                    <span>📷</span> Check Ripeness
                </button>

                {imgPreview && (
                    <div style={{marginTop: '15px'}}>
                        <img src={imgPreview} style={{maxHeight: '200px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}} />
                        <br />
                        {!analysis && !analyzing && (
                            <button className="camera-btn" style={{background: '#1976D2'}} onClick={analyzeImage}>
                                🤖 Ask Gemini
                            </button>
                        )}
                        {analyzing && <p>Consulting the banana database...</p>}
                        {analysis && <div className="ai-tip-box" style={{background: '#fff', marginTop: '15px'}}><strong>Gemini says:</strong> {analysis}</div>}
                    </div>
                )}
            </div>

            <div className="grid-2">
                <div className="section-box">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <h3>Ingredients</h3>
                        <button className="btn-reset" onClick={() => setCheckedIngs({})}>Reset</button>
                    </div>
                    
                    <div className="banana-input-container">
                        <label htmlFor="banana-count" style={{fontWeight: 'bold', marginRight: '10px', color: 'var(--primary-color)'}}>
                            🍌 How many bananas do you have?
                        </label>
                        <input 
                            id="banana-count"
                            type="number" 
                            min="1" 
                            max="6" 
                            value={bananaCount}
                            onChange={(e) => setBananaCount(parseInt(e.target.value) || 3)}
                            className="banana-number-input"
                        />
                    </div>

                    {requiresBatching && (
                        <div className="batching-warning">
                            ⚠️ <strong>Batching Required!</strong> This quantity exceeds the machine capacity (Max 3.5 cups flour). You'll need to make <strong>2 separate loaves</strong>.
                        </div>
                    )}

                    {requiresBatching && (
                        <div className="batch-note">
                            📝 <strong>Note:</strong> Ingredients listed are for ONE loaf. You will need to measure this out twice.
                        </div>
                    )}

                    <ul className="list-group">{INGREDIENTS.map((ing, i) => (
                            <li key={i} className={`list-item ${checkedIngs[i] ? 'checked' : ''}`} onClick={() => toggleIng(i)}>
                                <div className="checkbox">{checkedIngs[i] ? '✓' : ''}</div>
                                <div>
                                    <strong>{ing.amount} {ing.unit}</strong> {ing.name}
                                    {ing.sub && <div style={{fontSize: '0.8em', color: '#888'}}>Sub: {ing.sub}</div>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="substitutes">
                    <h3>Quick Substitutions</h3>
                    <p><strong>Missing Buttermilk?</strong><br/>Mix 1/3 cup milk + 1 tsp lemon juice. Let sit 5 mins.</p>
                    <p><strong>Flour:</strong><br/>You can swap up to 1/2 cup with Whole Wheat flour.</p>

                    <div className="variation-generator">
                        <h4>✨ Feeling Adventurous?</h4>
                        {!variation && !generatingVar && (
                            <button className="ai-btn" style={{fontSize: '1em', padding: '8px 16px'}} onClick={generateVariation}>
                                Generate Fun Variation
                            </button>
                        )}
                        {generatingVar && <div className="loader"></div>}
                        {variation && (
                            <div style={{fontSize: '0.9em', color: '#0D47A1', marginTop: '10px'}}>
                                {variation}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="section-box">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h3>Instructions</h3>
                    <button className="btn-reset" onClick={() => setCheckedSteps({})}>Reset</button>
                </div>
                
                {requiresBatching && (
                    <div className="batch-instructions">
                        <h4 style={{margin: '0 0 10px 0', color: 'var(--primary-color)'}}>🔄 Two-Batch Process</h4>
                        <p><strong>Batch 1:</strong> Use half your bananas (approx 3). Follow recipe below.</p>
                        <p><strong>Cool Down:</strong> Let machine cool for 20-30 mins.</p>
                        <p><strong>Batch 2:</strong> Repeat with remaining bananas.</p>
                    </div>
                )}

                <div>
                    {STEPS.map((step, i) => (
                        <div key={i} className={`step-item ${checkedSteps[i] ? 'checked' : ''}`} onClick={() => toggleStep(i)}>
                            <div style={{display: 'flex', alignItems: 'baseline'}}>
                                <span className="step-number">{i + 1}.</span>
                                <div style={{flex: 1}}>
                                    <strong>{step.title}</strong>
                                    {step.critical && <span className="critical-badge">Critical</span>}

                                    {step.aiPrompt && (
                                        <button className="ai-btn" onClick={(e) => askGeminiStep(e, i, step.aiPrompt)}>
                                            🤖 {stepTips[i] ? 'Hide Tip' : 'Ask AI'}
                                        </button>
                                    )}

                                    <div style={{marginTop: '5px'}}>{step.text}</div>

                                    {loadingTips[i] && <div className="ai-tip-box"><span className="loader"></span> Asking Gemini...</div>}

                                    {stepTips[i] && (
                                        <div className="ai-tip-box">
                                            <strong>Gemini says:</strong> {stepTips[i]}
                                        </div>
                                    )}
                                </div>
                                <div className="checkbox" style={{borderColor: '#ccc', color: '#fff', backgroundColor: checkedSteps[i] ? 'var(--success-color)' : 'transparent'}}>
                                    {checkedSteps[i] ? '✓' : ''}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
