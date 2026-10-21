from scipy.io import loadmat

file_path = "ml/data/B0005.mat"

data = loadmat(file_path)

battery = data["B0005"]

print("Type:", type(battery))
print("Shape:", battery.shape)
print("Number of dimensions:", battery.ndim)