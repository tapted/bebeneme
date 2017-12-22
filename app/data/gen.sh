MYSQL="mysql --defaults-file=my.cnf --skip-column-names"
FILTERS="AND name NOT LIKE '% %' AND name NOT LIKE '%-%'"

for sex in MALE FEMALE ; do
  for start in a b c d e f g h i j k l m n o p q r s t u v w x y z ; do
    $MYSQL <<< "SELECT name from names WHERE name like '${start}%' AND gender = '${sex}' ${FILTERS};" | gzip -9 > "${sex}-${start}.gz"
  done
done
