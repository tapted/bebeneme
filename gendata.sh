MYSQL="mysql --defaults-file=my.cnf --skip-column-names"
FILTERS="AND name NOT LIKE '% %' AND name NOT LIKE '%-%'"
ORDER="ORDER BY rating_total DESC"
SELECT="SELECT name from names WHERE name LIKE"

for sex in MALE FEMALE ; do
  for start in a b c d e f g h i j k l m n o p q r s t u v w x y z ; do
    $MYSQL <<< "${SELECT} '${start}%' AND gender = '${sex}' ${FILTERS} ${ORDER};" > "app/data/${sex}-${start}.txt"
  done
done
