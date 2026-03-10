// 健康瘦身助手 - 主程序

// 数据存储
let userProfile = JSON.parse(localStorage.getItem('dietProfile')) || null;
let dailyData = JSON.parse(localStorage.getItem('dailyData')) || {};
let todayMeals = JSON.parse(localStorage.getItem('todayMeals')) || [];
let todayExercise = JSON.parse(localStorage.getItem('todayExercise')) || [];
let waterIntake = parseInt(localStorage.getItem('todayWater')) || 0;
let weightHistory = JSON.parse(localStorage.getItem('weightHistory')) || [];
let weatherData = null;
let tomorrowPlan = null;

// 天气API配置（使用免费的Open-Meteo API）
const WEATHER_API = {
    baseURL: 'https://api.open-meteo.com/v1'
};

// 获取天气信息
async function getWeatherInfo() {
    const weatherInfoDiv = document.getElementById('weatherInfo');
    const weatherRecommendationDiv = document.getElementById('weatherRecommendation');
    
    try {
        // 获取地理位置
        let lat, lon, cityName = '当前位置';
        
        if (navigator.geolocation) {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    enableHighAccuracy: true
                });
            });
            
            lat = position.coords.latitude;
            lon = position.coords.longitude;
        } else {
            // 默认使用北京坐标
            lat = 39.9042;
            lon = 116.4074;
            cityName = '北京';
        }
        
        // 获取天气数据
        const response = await fetch(
            `${WEATHER_API.baseURL}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        
        const data = await response.json();
        
        weatherData = {
            current: data.current,
            daily: data.daily,
            cityName: cityName
        };
        
        // 显示天气信息
        renderWeatherInfo();
        
        // 更新推荐运动
        renderRecommendedExercise();
        
        // 提供天气建议
        updateWeatherRecommendation();
        
    } catch (error) {
        console.error('获取天气信息失败:', error);
        weatherInfoDiv.innerHTML = '<div class="weather-error">无法获取天气信息，请检查网络连接或位置权限</div>';
    }
}

// 渲染天气信息
function renderWeatherInfo() {
    const container = document.getElementById('weatherInfo');
    
    if (!weatherData) return;
    
    const weather = weatherData.current;
    const weatherCode = weather.weather_code;
    const weatherDesc = getWeatherDescription(weatherCode);
    const weatherIcon = getWeatherIcon(weatherCode);
    
    container.innerHTML = `
        <div class="weather-display">
            <div class="weather-main">
                <div class="weather-icon-large">${weatherIcon}</div>
                <div class="weather-temp">${Math.round(weather.temperature_2m)}°C</div>
                <div class="weather-desc">${weatherDesc}</div>
            </div>
            <div class="weather-details">
                <div class="weather-detail">
                    <span class="detail-icon">💨</span>
                    <span class="detail-value">风力: ${Math.round(weather.wind_speed_10m)} km/h</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-icon">💧</span>
                    <span class="detail-value">湿度: ${weather.relative_humidity_2m}%</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-icon">📍</span>
                    <span class="detail-value">${weatherData.cityName}</span>
                </div>
            </div>
        </div>
    `;
}

// 获取天气描述
function getWeatherDescription(code) {
    const weatherCodes = {
        0: '晴朗',
        1: '主要晴朗',
        2: '部分多云',
        3: '多云',
        45: '有雾',
        48: '雾凇',
        51: '小雨',
        53: '中雨',
        55: '大雨',
        61: '小雨',
        63: '中雨',
        65: '大雨',
        71: '小雪',
        73: '中雪',
        75: '大雪',
        80: '阵雨',
        81: '强阵雨',
        82: '暴雨',
        95: '雷暴',
        96: '雷暴伴冰雹',
        99: '强雷暴'
    };
    return weatherCodes[code] || '未知';
}

// 获取天气图标
function getWeatherIcon(code) {
    const weatherIcons = {
        0: '☀️',
        1: '🌤️',
        2: '⛅',
        3: '☁️',
        45: '🌫️',
        48: '🌫️',
        51: '🌧️',
        53: '🌧️',
        55: '🌧️',
        61: '🌧️',
        63: '🌧️',
        65: '🌧️',
        71: '❄️',
        73: '❄️',
        75: '❄️',
        80: '🌧️',
        81: '🌧️',
        82: '⛈️',
        95: '⛈️',
        96: '⛈️',
        99: '⛈️'
    };
    return weatherIcons[code] || '🌤️';
}

// 更新天气建议
function updateWeatherRecommendation() {
    const container = document.getElementById('weatherRecommendation');
    
    if (!weatherData) return;
    
    const temp = weatherData.current.temperature_2m;
    const weatherCode = weatherData.current.weather_code;
    const humidity = weatherData.current.relative_humidity_2m;
    
    let recommendation = '';
    let icon = '';
    
    // 根据天气给出建议
    if (weatherCode >= 61 && weatherCode <= 82) {
        // 雨天
        recommendation = '今天有雨，建议室内运动（瑜伽、力量训练、HIIT），记得带伞外出！';
        icon = '🌧️';
    } else if (weatherCode >= 71 && weatherCode <= 75) {
        // 雪天
        recommendation = '今天有雪，建议室内运动，注意保暖和防滑！';
        icon = '❄️';
    } else if (temp < 5) {
        // 寒冷天气
        recommendation = '气温较低，建议室内运动或做好热身准备，运动时注意保暖！';
        icon = '🥶';
    } else if (temp > 30) {
        // 炎热天气
        recommendation = '气温较高，建议早晚运动，避免正午时段，多补充水分！';
        icon = '🥵';
    } else if (humidity > 80) {
        // 高湿度
        recommendation = '湿度较高，运动时注意防暑和补水，建议选择室内运动！';
        icon = '💧';
    } else {
        // 适宜天气
        recommendation = '天气不错，适合户外运动！建议慢跑、骑行或散步等有氧运动。';
        icon = '😊';
    }
    
    container.innerHTML = `
        <div class="weather-recommendation-item">
            <span class="recommendation-icon">${icon}</span>
            <span class="recommendation-text">${recommendation}</span>
        </div>
    `;
}

// 常用食物库
const foodLibrary = [
    { id: 1, name: '米饭', icon: '🍚', calories: 116, category: 'grains' },
    { id: 2, name: '面条', icon: '🍜', calories: 137, category: 'grains' },
    { id: 3, name: '馒头', icon: '🥖', calories: 223, category: 'grains' },
    { id: 4, name: '鸡胸肉', icon: '🍗', calories: 165, category: 'protein' },
    { id: 5, name: '鸡蛋', icon: '🥚', calories: 155, category: 'protein' },
    { id: 6, name: '鱼', icon: '🐟', calories: 108, category: 'protein' },
    { id: 7, name: '牛肉', icon: '🥩', calories: 250, category: 'protein' },
    { id: 8, name: '豆腐', icon: '🧊', calories: 76, category: 'protein' },
    { id: 9, name: '西兰花', icon: '🥦', calories: 34, category: 'vegetables' },
    { id: 10, name: '菠菜', icon: '🥬', calories: 23, category: 'vegetables' },
    { id: 11, name: '胡萝卜', icon: '🥕', calories: 41, category: 'vegetables' },
    { id: 12, name: '黄瓜', icon: '🥒', calories: 16, category: 'vegetables' },
    { id: 13, name: '苹果', icon: '🍎', calories: 52, category: 'fruits' },
    { id: 14, name: '香蕉', icon: '🍌', calories: 89, category: 'fruits' },
    { id: 15, name: '橙子', icon: '🍊', calories: 47, category: 'fruits' },
    { id: 16, name: '葡萄', icon: '🍇', calories: 69, category: 'fruits' },
];

// 运动类型及热量消耗（每分钟）
const exerciseTypes = {
    walking: { name: '步行', icon: '🚶', calories: { low: 3, medium: 5, high: 7 } },
    running: { name: '跑步', icon: '🏃', calories: { low: 8, medium: 12, high: 15 } },
    swimming: { name: '游泳', icon: '🏊', calories: { low: 7, medium: 10, high: 14 } },
    cycling: { name: '骑行', icon: '🚴', calories: { low: 5, medium: 8, high: 12 } },
    yoga: { name: '瑜伽', icon: '🧘', calories: { low: 2, medium: 4, high: 6 } },
    strength: { name: '力量训练', icon: '🏋️', calories: { low: 4, medium: 7, high: 10 } },
    hiit: { name: 'HIIT', icon: '🔥', calories: { low: 10, medium: 14, high: 18 } },
    other: { name: '其他', icon: '🎯', calories: { low: 3, medium: 5, high: 8 } }
};

// 减肥禁忌提醒
const weightLossTaboos = [
    { icon: '🚫', title: '极端节食', desc: '每日摄入热量不应低于基础代谢率，会损害健康' },
    { icon: '⚠️', title: '熬夜', desc: '保证7-8小时睡眠，睡眠不足会增加食欲' },
    { icon: '🥓', title: '不吃早餐', desc: '规律三餐，不吃早餐会导致午餐过度进食' },
    { icon: '🛋️', title: '久坐不动', desc: '每小时起身活动5分钟，促进新陈代谢' },
    { icon: '🍔', title: '吃快餐', desc: '避免高热量快餐，选择新鲜食材' },
    { icon: '🥤', title: '含糖饮料', desc: '改喝水或无糖茶，避免糖分摄入' },
    { icon: '🧂', title: '高盐食物', desc: '减少盐分摄入，避免水肿' },
    { icon: '🍰', title: '甜食', desc: '控制甜食摄入，选择水果作为替代' }
];

// 初始化应用
function initDietApp() {
    setupEventListeners();
    loadUserProfile();
    updateDashboard();
    renderFoodLibrary();
    renderTodayMeals();
    renderExerciseRecords();
    renderTodayAlerts();
    renderCharts();
    
    // 检查是否是新的一天
    checkNewDay();
    
    // 获取天气信息
    getWeatherInfo();
    
    // 更新热量分析
    updateCaloriesAnalysis();
    
    // 加载已保存的明日计划
    loadTomorrowPlan();
}

// 设置事件监听器
function setupEventListeners() {
    // 标签切换
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // 保存资料
    document.getElementById('saveProfile').addEventListener('click', saveUserProfile);
    
    // 快速操作按钮
    document.getElementById('addMealBtn').addEventListener('click', () => showAddMealModal());
    document.getElementById('addExerciseBtn').addEventListener('click', () => showAddExerciseModal());
    document.getElementById('addWaterBtn').addEventListener('click', addWater);
    document.getElementById('updateWeightBtn').addEventListener('click', () => showUpdateWeightModal());
    
    // 饮食管理
    document.getElementById('addFoodBtn').addEventListener('click', addFood);
    
    // 运动管理
    document.getElementById('addExerciseRecordBtn').addEventListener('click', addExerciseRecord);
    
    // 食物分类
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            filterFoodLibrary(this.dataset.category);
        });
    });
    
    // 弹窗关闭
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// 切换标签页
function switchTab(tabId) {
    // 更新标签状态
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabId) {
            tab.classList.add('active');
        }
    });
    
    // 更新内容区域
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
            content.classList.add('active');
        }
    });
    
    // 刷新数据
    if (tabId === 'analysis') {
        renderCharts();
    }
}

// 加载用户资料
function loadUserProfile() {
    if (userProfile) {
        document.getElementById('gender').value = userProfile.gender;
        document.getElementById('age').value = userProfile.age;
        document.getElementById('height').value = userProfile.height;
        document.getElementById('weight').value = userProfile.weight;
        document.getElementById('goalWeight').value = userProfile.goalWeight;
        document.getElementById('weeklyGoal').value = userProfile.weeklyGoal;
        document.getElementById('activityLevel').value = userProfile.activityLevel;
        
        showCalculationResults();
        updateDashboard();
    }
}

// 保存用户资料
function saveUserProfile() {
    const gender = document.getElementById('gender').value;
    const age = parseInt(document.getElementById('age').value);
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const goalWeight = parseFloat(document.getElementById('goalWeight').value);
    const weeklyGoal = parseFloat(document.getElementById('weeklyGoal').value);
    const activityLevel = parseFloat(document.getElementById('activityLevel').value);
    
    // 验证输入
    if (!age || !height || !weight || !goalWeight) {
        alert('请填写完整的个人信息！');
        return;
    }
    
    // 计算各项指标
    const bmi = calculateBMI(height, weight);
    const bmr = calculateBMR(gender, age, height, weight);
    const tdee = bmr * activityLevel;
    const dailyDeficit = weeklyGoal * 7700 / 7; // 每周减重目标的热量缺口
    const recommendedCalories = Math.round(tdee - dailyDeficit);
    const weightToLose = weight - goalWeight;
    const estimatedDays = Math.ceil(weightToLose / weeklyGoal * 7);
    
    // 保存用户资料
    userProfile = {
        gender, age, height, weight, goalWeight, weeklyGoal, activityLevel,
        bmi, bmr, tdee, recommendedCalories, estimatedDays, createdDate: new Date().toISOString()
    };
    
    localStorage.setItem('dietProfile', JSON.stringify(userProfile));
    
    // 添加体重记录
    addWeightRecord(weight);
    
    showCalculationResults();
    updateDashboard();
    
    alert('资料保存成功！您的个人计划已生成。');
}

// 计算BMI
function calculateBMI(height, weight) {
    return (weight / ((height / 100) ** 2)).toFixed(1);
}

// 计算基础代谢率（Mifflin-St Jeor公式）
function calculateBMR(gender, age, height, weight) {
    let bmr;
    if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    return Math.round(bmr);
}

// 显示计算结果
function showCalculationResults() {
    const resultsDiv = document.getElementById('calculationResults');
    resultsDiv.style.display = 'block';
    
    document.getElementById('bmiValue').textContent = userProfile.bmi;
    
    const bmiStatus = document.getElementById('bmiStatus');
    const bmi = parseFloat(userProfile.bmi);
    if (bmi < 18.5) {
        bmiStatus.textContent = '偏瘦';
        bmiStatus.style.background = '#64b5f6';
    } else if (bmi < 24) {
        bmiStatus.textContent = '正常';
        bmiStatus.style.background = '#4caf50';
    } else if (bmi < 28) {
        bmiStatus.textContent = '超重';
        bmiStatus.style.background = '#ff9800';
    } else {
        bmiStatus.textContent = '肥胖';
        bmiStatus.style.background = '#f44336';
    }
    
    document.getElementById('bmrValue').textContent = userProfile.bmr;
    document.getElementById('tdeeValue').textContent = userProfile.tdee;
    document.getElementById('recommendedCalories').textContent = userProfile.recommendedCalories;
    
    const days = userProfile.estimatedDays;
    if (days > 0) {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        if (months > 0) {
            document.getElementById('estimatedDays').textContent = `${months}个月${remainingDays}天`;
        } else {
            document.getElementById('estimatedDays').textContent = `${days}天`;
        }
    } else {
        document.getElementById('estimatedDays').textContent = '已达成目标！';
    }
}

// 更新仪表盘
function updateDashboard() {
    if (!userProfile) return;
    
    // 今日热量
    const todayCalories = getTodayCalories();
    document.getElementById('todayCalories').textContent = todayCalories;
    document.getElementById('targetCalories').textContent = userProfile.recommendedCalories;
    
    const progressPercent = Math.min((todayCalories / userProfile.recommendedCalories) * 100, 100);
    document.getElementById('caloriesProgress').style.width = progressPercent + '%';
    
    // 当前体重
    document.getElementById('currentWeight').textContent = userProfile.weight;
    document.getElementById('targetWeight').textContent = userProfile.goalWeight;
    
    // 今日运动
    const exerciseMinutes = getTodayExerciseMinutes();
    document.getElementById('todayExercise').textContent = exerciseMinutes;
    document.getElementById('exerciseMinutes').textContent = exerciseMinutes;
    
    const exerciseCalories = getTodayExerciseCalories();
    document.getElementById('exerciseBurned').textContent = exerciseCalories;
    
    // 今日饮水
    document.getElementById('todayWater').textContent = waterIntake;
    
    // 更新饮食统计
    updateDietSummary();
}

// 获取今日总热量
function getTodayCalories() {
    return todayMeals.reduce((total, meal) => total + meal.totalCalories, 0);
}

// 获取今日运动分钟数
function getTodayExerciseMinutes() {
    return todayExercise.reduce((total, exercise) => total + exercise.duration, 0);
}

// 获取今日运动消耗热量
function getTodayExerciseCalories() {
    return todayExercise.reduce((total, exercise) => total + exercise.calories, 0);
}

// 更新饮食统计
function updateDietSummary() {
    const meals = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    
    todayMeals.forEach(meal => {
        meals[meal.type] += meal.totalCalories;
    });
    
    document.getElementById('breakfastCalories').textContent = meals.breakfast;
    document.getElementById('lunchCalories').textContent = meals.lunch;
    document.getElementById('dinnerCalories').textContent = meals.dinner;
    document.getElementById('snackCalories').textContent = meals.snack;
}

// 添加饮水
function addWater() {
    waterIntake++;
    localStorage.setItem('todayWater', waterIntake);
    updateDashboard();
    
    if (waterIntake >= 8) {
        alert('🎉 恭喜！今日饮水目标已达成！');
    }
}

// 添加食物
function addFood() {
    const mealType = document.getElementById('mealType').value;
    const foodName = document.getElementById('foodName').value.trim();
    const foodWeight = parseFloat(document.getElementById('foodWeight').value);
    const foodCalories = parseFloat(document.getElementById('foodCalories').value);
    
    if (!foodName || !foodWeight || !foodCalories) {
        alert('请填写完整的食物信息！');
        return;
    }
    
    const totalCalories = Math.round((foodCalories / 100) * foodWeight);
    
    const meal = {
        id: Date.now(),
        type: mealType,
        foods: [{ name: foodName, weight: foodWeight, calories: foodCalories, totalCalories }],
        totalCalories: totalCalories,
        timestamp: new Date().toISOString()
    };
    
    todayMeals.push(meal);
    localStorage.setItem('todayMeals', JSON.stringify(todayMeals));
    
    // 清空输入
    document.getElementById('foodName').value = '';
    document.getElementById('foodWeight').value = '';
    document.getElementById('foodCalories').value = '';
    
    renderTodayMeals();
    updateDashboard();
}

// 渲染食物库
function renderFoodLibrary(category = 'all') {
    const container = document.getElementById('foodList');
    
    const filteredFoods = category === 'all' 
        ? foodLibrary 
        : foodLibrary.filter(food => food.category === category);
    
    container.innerHTML = filteredFoods.map(food => `
        <div class="food-item" onclick="addFoodFromLibrary(${food.id})">
            <div class="food-item-icon">${food.icon}</div>
            <div class="food-item-name">${food.name}</div>
            <div class="food-item-calories">${food.calories} kcal/100g</div>
        </div>
    `).join('');
}

// 过滤食物库
function filterFoodLibrary(category) {
    // 更新按钮状态
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    renderFoodLibrary(category);
}

// 从食物库添加食物
function addFoodFromLibrary(foodId) {
    const food = foodLibrary.find(f => f.id === foodId);
    if (!food) return;
    
    const mealType = document.getElementById('mealType').value;
    const weight = prompt(`输入${food.name}的分量（克）：`, '100');
    if (!weight || isNaN(weight)) return;
    
    const totalCalories = Math.round((food.calories / 100) * parseFloat(weight));
    
    const meal = {
        id: Date.now(),
        type: mealType,
        foods: [{ name: food.name, weight: parseFloat(weight), calories: food.calories, totalCalories }],
        totalCalories: totalCalories,
        timestamp: new Date().toISOString()
    };
    
    todayMeals.push(meal);
    localStorage.setItem('todayMeals', JSON.stringify(todayMeals));
    
    renderTodayMeals();
    updateDashboard();
}

// 渲染今日饮食记录
function renderTodayMeals() {
    const container = document.getElementById('todayMealsList');
    
    if (todayMeals.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🍽️</div><div class="empty-state-text">暂无饮食记录</div></div>';
        return;
    }
    
    const mealTypeNames = {
        breakfast: '早餐',
        lunch: '午餐',
        dinner: '晚餐',
        snack: '加餐'
    };
    
    container.innerHTML = todayMeals.map(meal => `
        <div class="meal-record">
            <div class="meal-info">
                <div class="meal-time">${new Date(meal.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="meal-foods">${mealTypeNames[meal.type]} - ${meal.foods.map(f => `${f.name} ${f.weight}g`).join(', ')}</div>
                <div class="meal-calories">${meal.totalCalories} kcal</div>
            </div>
            <div class="record-actions">
                <button class="delete-btn" onclick="deleteMeal(${meal.id})">删除</button>
            </div>
        </div>
    `).join('');
}

// 删除饮食记录
function deleteMeal(mealId) {
    if (confirm('确定要删除这条记录吗？')) {
        todayMeals = todayMeals.filter(m => m.id !== mealId);
        localStorage.setItem('todayMeals', JSON.stringify(todayMeals));
        renderTodayMeals();
        updateDashboard();
    }
}

// 添加运动记录
function addExerciseRecord() {
    const type = document.getElementById('exerciseType').value;
    const duration = parseInt(document.getElementById('exerciseDuration').value);
    const intensity = document.getElementById('exerciseIntensity').value;
    
    if (!duration || duration <= 0) {
        alert('请输入运动时长！');
        return;
    }
    
    const exerciseType = exerciseTypes[type];
    const caloriesPerMinute = exerciseType.calories[intensity];
    const totalCalories = Math.round(caloriesPerMinute * duration);
    
    const exercise = {
        id: Date.now(),
        type: type,
        typeName: exerciseType.name,
        duration: duration,
        intensity: intensity,
        calories: totalCalories,
        timestamp: new Date().toISOString()
    };
    
    todayExercise.push(exercise);
    localStorage.setItem('todayExercise', JSON.stringify(todayExercise));
    
    // 清空输入
    document.getElementById('exerciseDuration').value = '';
    
    renderExerciseRecords();
    updateDashboard();
}

// 渲染运动记录
function renderExerciseRecords() {
    const container = document.getElementById('exerciseRecordList');
    
    if (todayExercise.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏃</div><div class="empty-state-text">暂无运动记录</div></div>';
        return;
    }
    
    const intensityNames = { low: '低强度', medium: '中等强度', high: '高强度' };
    
    container.innerHTML = todayExercise.map(exercise => `
        <div class="exercise-record-item">
            <div class="exercise-info">
                <div class="exercise-time">${new Date(exercise.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="exercise-type">${exercise.typeName} - ${intensityNames[exercise.intensity]}</div>
                <div class="exercise-calories">${exercise.duration}分钟 / 消耗${exercise.calories} kcal</div>
            </div>
            <div class="record-actions">
                <button class="delete-btn" onclick="deleteExercise(${exercise.id})">删除</button>
            </div>
        </div>
    `).join('');
    
    renderRecommendedExercise();
}

// 删除运动记录
function deleteExercise(exerciseId) {
    if (confirm('确定要删除这条记录吗？')) {
        todayExercise = todayExercise.filter(e => e.id !== exerciseId);
        localStorage.setItem('todayExercise', JSON.stringify(todayExercise));
        renderExerciseRecords();
        updateDashboard();
    }
}

// 渲染推荐运动
function renderRecommendedExercise() {
    const container = document.getElementById('recommendedExerciseList');
    
    const recommendations = [
        { type: 'walking', duration: 30, intensity: 'medium', desc: '轻松的步行，适合饭后消化' },
        { type: 'yoga', duration: 20, intensity: 'low', desc: '舒缓身心的瑜伽练习' },
        { type: 'strength', duration: 25, intensity: 'medium', desc: '力量训练增强肌肉' }
    ];
    
    const todayMinutes = getTodayExerciseMinutes();
    const remainingMinutes = Math.max(0, 30 - todayMinutes);
    
    if (todayMinutes >= 30) {
        container.innerHTML = '<p class="empty-state-text">🎉 今日运动目标已达成！</p>';
        return;
    }
    
    const exercise = recommendations[Math.floor(Math.random() * recommendations.length)];
    const exerciseType = exerciseTypes[exercise.type];
    
    container.innerHTML = `
        <div class="exercise-card">
            <div class="exercise-card-icon">${exerciseType.icon}</div>
            <div class="exercise-card-info">
                <div class="exercise-card-title">${exerciseType.name} - ${exercise.intensity === 'low' ? '低强度' : exercise.intensity === 'medium' ? '中等强度' : '高强度'}</div>
                <div class="exercise-card-desc">${exercise.desc}</div>
            </div>
            <div class="exercise-card-duration">${exercise.duration}分钟</div>
        </div>
    `;
}

// 添加体重记录
function addWeightRecord(weight) {
    const record = {
        date: new Date().toISOString().split('T')[0],
        weight: weight,
        timestamp: Date.now()
    };
    
    // 检查今天是否已有记录
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = weightHistory.findIndex(r => r.date === today);
    
    if (existingIndex >= 0) {
        weightHistory[existingIndex] = record;
    } else {
        weightHistory.push(record);
    }
    
    // 只保留最近30天的记录
    weightHistory = weightHistory.slice(-30);
    
    localStorage.setItem('weightHistory', JSON.stringify(weightHistory));
}

// 渲染今日提醒
function renderTodayAlerts() {
    const container = document.getElementById('todayAlerts');
    
    // 随机选择3个提醒
    const todayTaboos = weightLossTaboos.slice(0, 3);
    
    container.innerHTML = todayTaboos.map(taboo => `
        <div class="alert-item">
            <div class="alert-icon">${taboo.icon}</div>
            <div class="alert-text">
                <div class="alert-title">${taboo.title}</div>
                <div class="alert-desc">${taboo.desc}</div>
            </div>
        </div>
    `).join('');
}

// 渲染图表
function renderCharts() {
    renderWeightChart();
    renderCaloriesChart();
    renderExerciseChart();
}

// 渲染体重趋势图
function renderWeightChart() {
    const container = document.getElementById('weightChart');
    
    if (weightHistory.length < 2) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-text">需要至少2天的体重记录才能显示趋势</div></div>';
        return;
    }
    
    const maxWeight = Math.max(...weightHistory.map(r => r.weight));
    const minWeight = Math.min(...weightHistory.map(r => r.weight));
    const range = maxWeight - minWeight || 1;
    
    container.innerHTML = weightHistory.map(record => {
        const height = ((record.weight - minWeight) / range) * 200 + 50;
        return `
            <div class="chart-bar" style="height: ${height}px;">
                <div class="chart-bar-value">${record.weight}</div>
                <div class="chart-bar-label">${new Date(record.date).slice(5)}</div>
            </div>
        `;
    }).join('');
}

// 渲染热量趋势图
function renderCaloriesChart() {
    const container = document.getElementById('caloriesChart');
    
    // 获取最近7天的数据
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayMeals = JSON.parse(localStorage.getItem(`meals_${dateStr}`)) || [];
        const totalCalories = dayMeals.reduce((total, meal) => total + meal.totalCalories, 0);
        
        last7Days.push({ date: dateStr, calories: totalCalories });
    }
    
    const maxCalories = Math.max(...last7Days.map(d => d.calories), userProfile?.recommendedCalories || 2000);
    
    container.innerHTML = last7Days.map(day => {
        const height = (day.calories / maxCalories) * 250;
        return `
            <div class="chart-bar" style="height: ${height}px;">
                <div class="chart-bar-value">${day.calories}</div>
                <div class="chart-bar-label">${new Date(day.date).slice(5)}</div>
            </div>
        `;
    }).join('');
}

// 渲染运动趋势图
function renderExerciseChart() {
    const container = document.getElementById('exerciseChart');
    
    // 获取最近7天的数据
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayExercise = JSON.parse(localStorage.getItem(`exercise_${dateStr}`)) || [];
        const totalMinutes = dayExercise.reduce((total, exercise) => total + exercise.duration, 0);
        
        last7Days.push({ date: dateStr, minutes: totalMinutes });
    }
    
    const maxMinutes = Math.max(...last7Days.map(d => d.minutes), 30);
    
    container.innerHTML = last7Days.map(day => {
        const height = (day.minutes / maxMinutes) * 250;
        return `
            <div class="chart-bar" style="height: ${height}px;">
                <div class="chart-bar-value">${day.minutes}</div>
                <div class="chart-bar-label">${new Date(day.date).slice(5)}</div>
            </div>
        `;
    }).join('');
}

// 检查是否是新的一天
function checkNewDay() {
    const lastDate = localStorage.getItem('lastDate');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastDate !== today) {
        // 保存昨天的数据
        localStorage.setItem(`meals_${lastDate}`, JSON.stringify(todayMeals));
        localStorage.setItem(`exercise_${lastDate}`, JSON.stringify(todayExercise));
        
        // 重置今日数据
        todayMeals = [];
        todayExercise = [];
        waterIntake = 0;
        
        localStorage.setItem('todayMeals', JSON.stringify(todayMeals));
        localStorage.setItem('todayExercise', JSON.stringify(todayExercise));
        localStorage.setItem('todayWater', waterIntake);
        localStorage.setItem('lastDate', today);
        
        updateDashboard();
        renderTodayMeals();
        renderExerciseRecords();
    }
}

// 弹窗功能
function showAddMealModal() {
    document.getElementById('modalTitle').textContent = '添加餐食';
    document.getElementById('modalBody').innerHTML = `
        <div class="meal-form">
            <div class="form-group">
                <label>餐次</label>
                <select id="modalMealType">
                    <option value="breakfast">早餐</option>
                    <option value="lunch">午餐</option>
                    <option value="dinner">晚餐</option>
                    <option value="snack">加餐</option>
                </select>
            </div>
            <div class="form-group">
                <label>食物名称</label>
                <input type="text" id="modalFoodName" placeholder="例如：米饭、鸡胸肉">
            </div>
            <div class="form-group">
                <label>分量（克）</label>
                <input type="number" id="modalFoodWeight" placeholder="100">
            </div>
            <div class="form-group">
                <label>热量（kcal）</label>
                <input type="number" id="modalFoodCalories" placeholder="100">
            </div>
            <button class="btn-primary" onclick="addFoodFromModal()">添加</button>
        </div>
    `;
    document.getElementById('modal').classList.add('show');
}

function addFoodFromModal() {
    const mealType = document.getElementById('modalMealType').value;
    const foodName = document.getElementById('modalFoodName').value.trim();
    const foodWeight = parseFloat(document.getElementById('modalFoodWeight').value);
    const foodCalories = parseFloat(document.getElementById('modalFoodCalories').value);
    
    if (!foodName || !foodWeight || !foodCalories) {
        alert('请填写完整信息！');
        return;
    }
    
    const totalCalories = Math.round((foodCalories / 100) * foodWeight);
    
    const meal = {
        id: Date.now(),
        type: mealType,
        foods: [{ name: foodName, weight: foodWeight, calories: foodCalories, totalCalories }],
        totalCalories: totalCalories,
        timestamp: new Date().toISOString()
    };
    
    todayMeals.push(meal);
    localStorage.setItem('todayMeals', JSON.stringify(todayMeals));
    
    renderTodayMeals();
    updateDashboard();
    closeModal();
}

function showAddExerciseModal() {
    document.getElementById('modalTitle').textContent = '添加运动';
    document.getElementById('modalBody').innerHTML = `
        <div class="exercise-form">
            <div class="form-group">
                <label>运动类型</label>
                <select id="modalExerciseType">
                    ${Object.entries(exerciseTypes).map(([key, val]) => 
                        `<option value="${key}">${val.icon} ${val.name}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>运动时长（分钟）</label>
                <input type="number" id="modalExerciseDuration" placeholder="30">
            </div>
            <div class="form-group">
                <label>运动强度</label>
                <select id="modalExerciseIntensity">
                    <option value="low">低强度</option>
                    <option value="medium" selected>中等强度</option>
                    <option value="high">高强度</option>
                </select>
            </div>
            <button class="btn-primary" onclick="addExerciseFromModal()">添加</button>
        </div>
    `;
    document.getElementById('modal').classList.add('show');
}

function addExerciseFromModal() {
    const type = document.getElementById('modalExerciseType').value;
    const duration = parseInt(document.getElementById('modalExerciseDuration').value);
    const intensity = document.getElementById('modalExerciseIntensity').value;
    
    if (!duration || duration <= 0) {
        alert('请输入运动时长！');
        return;
    }
    
    const exerciseType = exerciseTypes[type];
    const caloriesPerMinute = exerciseType.calories[intensity];
    const totalCalories = Math.round(caloriesPerMinute * duration);
    
    const exercise = {
        id: Date.now(),
        type: type,
        typeName: exerciseType.name,
        duration: duration,
        intensity: intensity,
        calories: totalCalories,
        timestamp: new Date().toISOString()
    };
    
    todayExercise.push(exercise);
    localStorage.setItem('todayExercise', JSON.stringify(todayExercise));
    
    renderExerciseRecords();
    updateDashboard();
    closeModal();
}

function showUpdateWeightModal() {
    document.getElementById('modalTitle').textContent = '更新体重';
    document.getElementById('modalBody').innerHTML = `
        <div class="form-group">
            <label>当前体重（kg）</label>
            <input type="number" id="modalWeight" placeholder="${userProfile?.weight || ''}" step="0.1">
        </div>
        <button class="btn-primary" onclick="updateWeightFromModal()">更新</button>
    `;
    document.getElementById('modal').classList.add('show');
}

function updateWeightFromModal() {
    const weight = parseFloat(document.getElementById('modalWeight').value);
    
    if (!weight || weight <= 0) {
        alert('请输入有效的体重！');
        return;
    }
    
    userProfile.weight = weight;
    localStorage.setItem('dietProfile', JSON.stringify(userProfile));
    
    addWeightRecord(weight);
    updateDashboard();
    
    closeModal();
    alert('体重更新成功！');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

// PWA安装提示
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // 显示安装按钮
    showInstallButton();
});

function showInstallButton() {
    // 检查是否已经有安装按钮
    if (!document.getElementById('installBtn')) {
        const installBtn = document.createElement('button');
        installBtn.id = 'installBtn';
        installBtn.className = 'btn-install';
        installBtn.innerHTML = '📱 安装到主屏幕';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(76, 175, 80, 0.4);
            z-index: 1000;
            animation: slideUp 0.5s ease-out;
        `;
        installBtn.onclick = installApp;
        document.body.appendChild(installBtn);
    }
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('用户接受了安装提示');
            }
            deferredPrompt = null;
            const installBtn = document.getElementById('installBtn');
            if (installBtn) {
                installBtn.remove();
            }
        });
    }
}

// 注册Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker 注册成功:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker 注册失败:', error);
            });
    });
}

// 页面加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDietApp);
} else {
    initDietApp();
}

// ==================== 新增功能 ====================

// 生成明日计划
function generateTomorrowPlan() {
    if (!userProfile) {
        alert('请先完善个人资料！');
        return;
    }
    
    const todayIntake = getTodayCalories();
    const todayBurn = getTodayExerciseCalories();
    const netCalories = todayIntake - todayBurn;
    const recommended = userProfile.recommendedCalories;
    
    // 计算今日表现
    const todayPerformance = {
        intakeCalories: todayIntake,
        burnCalories: todayBurn,
        exerciseMinutes: getTodayExerciseMinutes(),
        deficit: recommended - netCalories
    };
    
    // 生成饮食建议
    let dietAdvice = '';
    let targetCalories = recommended;
    
    if (todayPerformance.deficit < -500) {
        dietAdvice = '今日热量摄入较高，建议明日适当减少热量摄入，增加蔬菜和蛋白质比例。';
        targetCalories = Math.round(recommended * 0.85);
    } else if (todayPerformance.deficit > 500) {
        dietAdvice = '今日热量摄入偏低，明日可以适当增加蛋白质和碳水化合物的摄入。';
        targetCalories = Math.round(recommended * 1.1);
    } else {
        dietAdvice = '今日热量控制良好，明日继续保持均衡饮食，注意营养搭配。';
    }
    
    // 生成运动建议
    let exerciseAdvice = '';
    let targetExercise = 30;
    let recommendedExerciseType = 'walking';
    let exerciseIntensity = 'medium';
    
    // 根据天气调整运动推荐
    if (weatherData) {
        const weatherCode = weatherData.current.weather_code;
        const temp = weatherData.current.temperature_2m;
        
        if (weatherCode >= 61 && weatherCode <= 82) {
            exerciseAdvice = '预计明天有雨，建议进行室内运动，如瑜伽、力量训练或HIIT。';
            recommendedExerciseType = ['yoga', 'strength', 'hiit'][Math.floor(Math.random() * 3)];
        } else if (temp < 5) {
            exerciseAdvice = '气温较低，建议室内运动或做好充分热身准备。';
            recommendedExerciseType = ['yoga', 'strength', 'other'][Math.floor(Math.random() * 3)];
        } else if (temp > 30) {
            exerciseAdvice = '气温较高，建议早晚运动或选择室内运动，注意补水。';
            recommendedExerciseType = ['yoga', 'swimming', 'other'][Math.floor(Math.random() * 3)];
        } else {
            exerciseAdvice = '天气适宜，建议户外有氧运动，如慢跑、骑行或散步。';
            recommendedExerciseType = ['running', 'cycling', 'walking'][Math.floor(Math.random() * 3)];
        }
    } else {
        if (todayPerformance.exerciseMinutes < 30) {
            exerciseAdvice = '今日运动量不足，建议明日增加有氧运动时间至30分钟以上。';
            targetExercise = 40;
            recommendedExerciseType = 'walking';
        } else if (todayPerformance.exerciseMinutes < 60) {
            exerciseAdvice = '今日运动量达标，明日继续保持，可尝试不同运动类型。';
            targetExercise = 30;
            recommendedExerciseType = ['running', 'yoga', 'cycling'][Math.floor(Math.random() * 3)];
        } else {
            exerciseAdvice = '今日运动量充足，明日可适当休息或进行轻度运动。';
            targetExercise = 20;
            recommendedExerciseType = 'yoga';
        }
    }
    
    const tomorrowPlan = {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        targetCalories: targetCalories,
        dietAdvice: dietAdvice,
        targetExerciseMinutes: targetExercise,
        recommendedExerciseType: recommendedExerciseType,
        exerciseAdvice: exerciseAdvice,
        todayPerformance: todayPerformance,
        weatherBased: weatherData !== null
    };
    
    localStorage.setItem('tomorrowPlan', JSON.stringify(tomorrowPlan));
    renderTomorrowPlan(tomorrowPlan);
}

// 加载已保存的明日计划
function loadTomorrowPlan() {
    const savedPlan = localStorage.getItem('tomorrowPlan');
    
    if (savedPlan) {
        const plan = JSON.parse(savedPlan);
        const planDate = plan.date;
        const today = new Date().toISOString().split('T')[0];
        
        if (planDate === today || planDate === new Date(Date.now() + 86400000).toISOString().split('T')[0]) {
            renderTomorrowPlan(plan);
        } else {
            generateTomorrowPlan();
        }
    }
}

// 渲染明日计划
function renderTomorrowPlan(plan) {
    const container = document.getElementById('tomorrowPlan');
    
    const exerciseType = exerciseTypes[plan.recommendedExerciseType];
    const weatherBadge = plan.weatherBased ? '<span class="badge-weather">🌤️ 基于天气</span>' : '';
    
    container.innerHTML = `
        <div class="tomorrow-plan-card">
            <div class="plan-header">
                <h4>📅 ${new Date(plan.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</h4>
                ${weatherBadge}
            </div>
            
            <div class="plan-section">
                <div class="plan-section-title">🍽️ 饮食计划</div>
                <div class="plan-detail">
                    <div class="plan-target">目标热量：<strong>${plan.targetCalories}</strong> kcal</div>
                    <div class="plan-advice">${plan.dietAdvice}</div>
                    <div class="meal-distribution">
                        <div class="meal-dist-item">🌅 早餐: ${Math.round(plan.targetCalories * 0.25)} kcal</div>
                        <div class="meal-dist-item">☀️ 午餐: ${Math.round(plan.targetCalories * 0.35)} kcal</div>
                        <div class="meal-dist-item">🌆 晚餐: ${Math.round(plan.targetCalories * 0.3)} kcal</div>
                        <div class="meal-dist-item">🥤 加餐: ${Math.round(plan.targetCalories * 0.1)} kcal</div>
                    </div>
                </div>
            </div>
            
            <div class="plan-section">
                <div class="plan-section-title">🏃 运动计划</div>
                <div class="plan-detail">
                    <div class="plan-target">目标运动：<strong>${plan.targetExerciseMinutes}</strong> 分钟</div>
                    <div class="plan-recommended">
                        推荐运动：<span class="exercise-badge">${exerciseType.icon} ${exerciseType.name}</span>
                    </div>
                    <div class="plan-advice">${plan.exerciseAdvice}</div>
                </div>
            </div>
            
            <div class="plan-today-summary">
                <div class="summary-title">📊 今日总结</div>
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="summary-label">热量摄入</span>
                        <span class="summary-val">${plan.todayPerformance.intakeCalories} kcal</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">运动消耗</span>
                        <span class="summary-val">${plan.todayPerformance.burnCalories} kcal</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">热量缺口</span>
                        <span class="summary-val ${plan.todayPerformance.deficit >= 0 ? 'success' : 'warning'}">
                            ${plan.todayPerformance.deficit > 0 ? '+' : ''}${plan.todayPerformance.deficit} kcal
                        </span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">运动时长</span>
                        <span class="summary-val">${plan.todayPerformance.exerciseMinutes} 分钟</span>
                    </div>
                </div>
            </div>
            
            <div class="plan-actions">
                <button class="btn-secondary" onclick="regenerateTomorrowPlan()">🔄 重新生成</button>
                <button class="btn-primary" onclick="startTomorrowPlan()">✅ 我知道了</button>
            </div>
        </div>
    `;
}

// 重新生成明日计划
function regenerateTomorrowPlan() {
    if (confirm('是否要重新生成明日计划？这将根据今日数据重新计算。')) {
        generateTomorrowPlan();
    }
}

// 确认明日计划
function startTomorrowPlan() {
    alert('计划已确认！明天请按照计划执行，加油！💪');
}

// 更新天气驱动的运动推荐
function renderRecommendedExercise() {
    const container = document.getElementById('recommendedExerciseList');
    
    if (!userProfile) {
        container.innerHTML = '<p class="empty-state-text">请先完善个人资料</p>';
        return;
    }
    
    let recommendations = [];
    
    // 根据天气调整推荐
    if (weatherData) {
        const weatherCode = weatherData.current.weather_code;
        const temp = weatherData.current.temperature_2m;
        
        if (weatherCode >= 61 && weatherCode <= 82) {
            recommendations = [
                { type: 'yoga', duration: 30, intensity: 'low', desc: '室内瑜伽，放松身心' },
                { type: 'strength', duration: 25, intensity: 'medium', desc: '力量训练，增强肌肉' },
                { type: 'hiit', duration: 20, intensity: 'high', desc: '高强度间歇训练' }
            ];
        } else if (temp < 5 || temp > 30) {
            recommendations = [
                { type: 'yoga', duration: 30, intensity: 'low', desc: '舒适的室内瑜伽' },
                { type: 'strength', duration: 30, intensity: 'medium', desc: '室内力量训练' },
                { type: 'other', duration: 30, intensity: 'low', desc: '室内伸展运动' }
            ];
        } else {
            recommendations = [
                { type: 'walking', duration: 30, intensity: 'medium', desc: '户外轻松步行' },
                { type: 'running', duration: 25, intensity: 'medium', desc: '户外有氧慢跑' },
                { type: 'cycling', duration: 30, intensity: 'medium', desc: '户外骑行' }
            ];
        }
    } else {
        recommendations = [
            { type: 'walking', duration: 30, intensity: 'medium', desc: '轻松的步行，适合饭后消化' },
            { type: 'yoga', duration: 20, intensity: 'low', desc: '舒缓身心的瑜伽练习' },
            { type: 'strength', duration: 25, intensity: 'medium', desc: '力量训练增强肌肉' }
        ];
    }
    
    const todayMinutes = getTodayExerciseMinutes();
    
    if (todayMinutes >= 30) {
        container.innerHTML = '<p class="empty-state-text">🎉 今日运动目标已达成！</p>';
        return;
    }
    
    container.innerHTML = recommendations.map(rec => {
        const exerciseType = exerciseTypes[rec.type];
        return `
            <div class="exercise-card">
                <div class="exercise-card-icon">${exerciseType.icon}</div>
                <div class="exercise-card-info">
                    <div class="exercise-card-title">${exerciseType.name} - ${rec.intensity === 'low' ? '低强度' : rec.intensity === 'medium' ? '中等强度' : '高强度'}</div>
                    <div class="exercise-card-desc">${rec.desc}</div>
                </div>
                <div class="exercise-card-duration">${rec.duration}分钟</div>
            </div>
        `;
    }).join('');
}
