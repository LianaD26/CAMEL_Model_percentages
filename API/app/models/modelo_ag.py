import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score

camel_structure = {
    "C": ["Solvencia", "Capacidad", "ICC"],
    "A": ["Cubrimiento_cartera", "Cartera_vencida"],
    "M": ["Calidad", "Cubrimiento_financiero"],
    "E": ["ROE", "ROA"],
    "L": ["IRL"]
}

n_blocks = len(camel_structure)
n_subs = sum(len(v) for v in camel_structure.values())
n_genes = n_blocks + n_subs

def evaluate(individual, X, y, n_splits=5):
    block_weights = individual[:n_blocks]
    sub_weights = individual[n_blocks:]

    block_weights = np.clip(block_weights, 0, None)
    block_weights /= block_weights.sum()

    idx = 0
    normalized_subs = []
    for i, (block, indicators) in enumerate(camel_structure.items()):
        subblock = sub_weights[idx: idx + len(indicators)]
        subblock = np.clip(subblock, 0, None)
        if subblock.sum() == 0:
            subblock = np.ones_like(subblock) / len(subblock)
        else:
            subblock = subblock / subblock.sum()
        subblock *= block_weights[i]
        normalized_subs.extend(subblock)
        idx += len(indicators)
    normalized_subs = np.array(normalized_subs)

    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=0)
    aucs = []
    for train_idx, test_idx in skf.split(X, y):
        X_test, y_test = X[test_idx], y[test_idx]
        scores = X_test.dot(normalized_subs)
        try:
            aucs.append(roc_auc_score(y_test, scores))
        except ValueError:
            aucs.append(0.5)
    return np.mean(aucs), normalized_subs

def genetic_algorithm(X, y, pop_size=30, generations=50, mutation_rate=0.2):
    population = np.random.rand(pop_size, n_genes)
    best_solution, best_auc = None, -1

    for gen in range(generations):
        results = [evaluate(ind, X, y) for ind in population]
        fitness = np.array([r[0] for r in results])

        if fitness.max() > best_auc:
            best_auc = fitness.max()
            best_solution = results[np.argmax(fitness)][1]

        probs = fitness / fitness.sum()
        selected = population[np.random.choice(pop_size, size=pop_size, p=probs)]

        offspring = []
        for i in range(0, pop_size, 2):
            p1, p2 = selected[i], selected[(i+1) % pop_size]
            alpha = np.random.rand()
            c1 = alpha*p1 + (1-alpha)*p2
            c2 = alpha*p2 + (1-alpha)*p1
            offspring.extend([c1, c2])
        offspring = np.array(offspring)

        for i in range(pop_size):
            if np.random.rand() < mutation_rate:
                idx = np.random.randint(0, n_genes)
                offspring[i][idx] += np.random.uniform(-0.2, 0.2)
                offspring[i] = np.clip(offspring[i], 0, None)

        population = offspring

    return best_solution, best_auc
