import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
import matplotlib.patches as mpatches
import numpy

# 1 = Very dangerous
# 2 = moderately dangerous
# 3 = not dangerous

# Definitions

img = numpy.array([
    [1,1,1,1,1,1],
    [2,2,1,1,1,1],
    [3,2,2,2,1,1],
    [3,3,2,2,2,2],
    [3,3,3,3,3,2]
])

colors = ["#FF0000","#FFFF00", "#00FF00"]

cmap = {
    1 : (1.0,0.0,0.0),
    2 : (1.0,1.0,0.0),
    3 : (0.0,1.0,0.0),
}

arrayShow = numpy.array([[cmap[i] for i in j] for j in img])

labels = {
   1 : "Igangsæt tiltag",
   2 : "Overvej tiltag",
   3 : "Ingen aktion",
}


x_ticks = [
    "Umulig (1)",
    "Usandsynlig (2)",
    "Sjælden (3)",
    "Moderat (4)",
    "Hyppig (5)",
    "Meget Hyppig (6)"
]

y_ticks = [
    "Katastrofal (5)",
    "Kritisk (4)",
    "Moderat (3)",
    "Ringe (2)",
    "Ubetydelig (1)",
]

# Plot generation

fig, ax = plt.subplots()
ax.set_title("Riskoanalyse")

# This creates a grid around the pixel values
plt.hlines(y=numpy.arange(0, len(x_ticks))+0.5, xmin=numpy.full(6, 0)-0.5, xmax=numpy.full(6, 6)-0.5, color="black")
plt.vlines(x=numpy.arange(0, len(x_ticks))+0.5, ymin=numpy.full(6, 0)-0.5, ymax=numpy.full(6, 6)-0.5, color="black")

ax.set_xticks(numpy.arange(len(x_ticks)), labels=x_ticks)
ax.set_yticks(numpy.arange(len(y_ticks)), labels=y_ticks)

plt.setp(ax.get_xticklabels(), rotation=45, ha="right",
         rotation_mode="anchor")

ax.set_ylabel("Konsekvens af hændelse")
ax.set_xlabel("Sandsynlighed for forekomst")


patches =[mpatches.Patch(color=cmap[i],label=labels[i]) for i in cmap]
plt.legend(handles=patches, bbox_to_anchor=(1.05, 1), loc=2)

ax.imshow(arrayShow)

# Use the plot to get a figure you like, you can argue for a savefig

plt.show()